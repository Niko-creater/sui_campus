/*
/// Module: sui_campus
module sui_campus::sui_campus;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module sui_campus::forum {
    
    use sui::table::Table;
    use std::string::String;
    use sui::package::{Self, Publisher};
    use sui::clock::Clock;
    use sui::event;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    const EWrongPublisher: u64 = 1;

    const E_TITLE_EMPTY: u64 = 1;
    const E_CONTENT_EMPTY: u64 = 2;

    public struct FORUM has drop {}

    public struct Forum has key, store {
        id: UID,
        post_index: u64,                   
        posts: Table<u64, ID>,              
    }

    public struct Post has key, store {
        id: UID,
        author: address,
        title: String,
        blob_id: String,                        
        created_at_ms: u64,
        tip_total: u64,                    
        dislike_count: u64,
        comment_index: u64,                 
        comments: Table<u64, CommentData>,
        tip_index: u64,                     
        tips: Table<u64, TipRecord>,         
    }

    public struct CommentData has store {
        author: address,
        content: String,                    
        blob_id: String,
        created_at_ms: u64,
    }

    public struct TipRecord has store {
        tipper: address,
        amount_mist: u64,
        created_at_ms: u64,
        is_anonymous: bool,
    }

    // Event

    public struct PostCreated has copy, drop {
        post_id: ID,
        author: address,
        title: String,
        blob_id: String,
        post_seq: u64,
        ts_ms: u64,
    }

    public struct PostTipped has copy, drop {
        post_id: ID,
        tipper: address,
        amount_mist: u64,
        ts_ms: u64,
        is_anonymous: bool,
    }

    public struct PostDisliked has copy, drop {
        post_id: ID,
        disliker: address,
    }

    public struct CommentAdded has copy, drop {
        post_id: ID,
        author: address,
        comment_seq: u64,
        has_uri: bool,
        ts_ms: u64,
    }

    fun init(otw: FORUM, ctx: &mut TxContext) {
        // create Publisher and transfer it to the publisher wallet
        package::claim_and_keep(otw, ctx)
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext): Publisher {
        package::claim(FORUM {}, ctx)
    }

    public fun init_forum(publisher: &Publisher, ctx: &mut TxContext) {
        assert!(publisher.from_module<FORUM>(), EWrongPublisher);

        let forum = Forum {
            id: object::new(ctx),
            post_index: 0,
            posts: sui::table::new<u64, ID>(ctx),
        };
        transfer::share_object(forum);
    }

    public fun create_post(
        forum: &mut Forum,
        title: String,
        blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        if (std::string::is_empty(&title)) {
            abort E_TITLE_EMPTY
        };
        if (std::string::is_empty(&blob_id)) {
            abort E_CONTENT_EMPTY
        };

        let ts = sui::clock::timestamp_ms(clock);

        forum.post_index = forum.post_index + 1;
        let seq = forum.post_index;

        let post = Post {
            id: object::new(ctx),
            author: sui::tx_context::sender(ctx),
            title,
            blob_id,
            created_at_ms: ts,
            tip_total: 0,
            dislike_count: 0,
            comment_index: 0,
            comments: sui::table::new<u64, CommentData>(ctx),
            tip_index: 0,
            tips: sui::table::new<u64, TipRecord>(ctx),
        };
        let post_id = object::uid_to_inner(&post.id);
        let title = post.title;
        let blob_id = post.blob_id;

        sui::table::add(&mut forum.posts, seq, post_id);

        transfer::share_object(post);

        event::emit(PostCreated {
            post_id: post_id,
            author: tx_context::sender(ctx),
            title: title,
            blob_id: blob_id,
            post_seq: seq,
            ts_ms: ts
        });
    }

    public fun tip_post(
        post: &mut Post,
        coin: Coin<SUI>,
        is_anonymous: bool,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&coin);
        assert!(amount > 0, 0); 
        
        let ts = sui::clock::timestamp_ms(clock);
        let tipper = tx_context::sender(ctx);
        
        post.tip_index = post.tip_index + 1;
        let tip_seq = post.tip_index;
        
        let tip_record = TipRecord {
            tipper,
            amount_mist: amount,
            created_at_ms: ts,
            is_anonymous,
        };
        
        sui::table::add(&mut post.tips, tip_seq, tip_record);
        
        post.tip_total = post.tip_total + amount;
        
        let post_author = post.author;
        transfer::public_transfer(coin, post_author);
        
        event::emit(PostTipped {
            post_id: object::uid_to_inner(&post.id),
            tipper,
            amount_mist: amount,
            ts_ms: ts,
            is_anonymous,
        });
    }

    public fun dislike_post(
        post: &mut Post,
        ctx: &mut TxContext
    ) {
        let disliker = tx_context::sender(ctx);
        
        post.dislike_count = post.dislike_count + 1;
        
        event::emit(PostDisliked {
            post_id: object::uid_to_inner(&post.id),
            disliker,
        });
    }

    public fun add_comment(
        post: &mut Post,
        content: String,
        blob_id: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        if (std::string::is_empty(&content)) {
            abort E_CONTENT_EMPTY
        };
        if (std::string::is_empty(&blob_id)) {
            abort E_CONTENT_EMPTY
        };

        let ts = sui::clock::timestamp_ms(clock);
        let author = tx_context::sender(ctx);
        
        post.comment_index = post.comment_index + 1;
        let comment_seq = post.comment_index;
        
        let comment_data = CommentData {
            author,
            content,
            blob_id,
            created_at_ms: ts,
        };
        
        sui::table::add(&mut post.comments, comment_seq, comment_data);
        
        event::emit(CommentAdded {
            post_id: object::uid_to_inner(&post.id),
            author,
            comment_seq,
            has_uri: true, 
            ts_ms: ts,
        });
    }

    // Query Functions
    public fun get_post_tip_total(post: &Post): u64 {
        post.tip_total
    }

    public fun get_post_tip_count(post: &Post): u64 {
        post.tip_index
    }

    public fun get_tip_record(post: &Post, tip_seq: u64): (address, u64, u64, bool) {
        let tip_record = sui::table::borrow(&post.tips, tip_seq);
        (tip_record.tipper, tip_record.amount_mist, tip_record.created_at_ms, tip_record.is_anonymous)
    }

    public fun get_post_author(post: &Post): address {
        post.author
    }

    public fun get_post_title(post: &Post): String {
        post.title
    }

    public fun get_post_blob_id(post: &Post): String {
        post.blob_id
    }

    public fun get_post_created_at(post: &Post): u64 {
        post.created_at_ms
    }

    public fun get_post_dislike_count(post: &Post): u64 {
        post.dislike_count
    }

    public fun get_post_comment_count(post: &Post): u64 {
        post.comment_index
    }

    public fun get_comment_data(post: &Post, comment_seq: u64): (address, String, String, u64) {
        let comment_data = sui::table::borrow(&post.comments, comment_seq);
        (comment_data.author, comment_data.content, comment_data.blob_id, comment_data.created_at_ms)
    }

    // Forum query functions
    public fun get_forum_post_count(forum: &Forum): u64 {
        forum.post_index
    }

    public fun get_forum_post_id(forum: &Forum, post_seq: u64): ID {
        *sui::table::borrow(&forum.posts, post_seq)
    }

}

