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
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    const EWrongPublisher: u64 = 1;

    const E_TITLE_EMPTY: u64 = 1;
    const E_CONTENT_EMPTY: u64 = 2;
    const E_NOT_IMPLEMENTED: u64 = 999;

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
        uri: String,                        
        created_at_ms: u64,
        tip_total: u64,                    
        dislike_count: u64,
        comment_index: u64,                 
        comments: Table<u64, CommentData>,  
    }

    public struct CommentData has store {
        author: address,
        content: String,                    
        uri: Option<String>,
        created_at_ms: u64,
    }

    // Event

    public struct PostCreated has copy, drop {
        post_id: ID,
        author: address,
        title: String,
        uri: String,
        post_seq: u64,
        ts_ms: u64,
    }

    public struct PostTipped has copy, drop {
        post_id: ID,
        tipper: address,
        amount_mist: u64,
        ts_ms: u64,
    }

    public struct PostDisliked has copy, drop {
        post_id: ID,
        disliker: address,
        ts_ms: u64,
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
        uri: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        if (std::string::is_empty(&title)) {
            abort E_TITLE_EMPTY
        };
        if (std::string::is_empty(&uri)) {
            abort E_CONTENT_EMPTY
        };

        let ts = sui::clock::timestamp_ms(clock);

        forum.post_index = forum.post_index + 1;
        let seq = forum.post_index;

        let post = Post {
            id: object::new(ctx),
            author: sui::tx_context::sender(ctx),
            title,
            uri,
            created_at_ms: ts,
            tip_total: 0,
            dislike_count: 0,
            comment_index: 0,
            comments: sui::table::new<u64, CommentData>(ctx),
        };
        let post_id = object::uid_to_inner(&post.id);
        let title = post.title;
        let uri = post.uri;

        sui::table::add(&mut forum.posts, seq, post_id);

        transfer::share_object(post);

        event::emit(PostCreated {
            post_id: post_id,
            author: tx_context::sender(ctx),
            title: title,
            uri: uri,
            post_seq: seq,
            ts_ms: ts
        });
    }

    public fun tip_post(
        post: &mut Post,
        mut coin: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        abort E_NOT_IMPLEMENTED;
    }

    public fun dislike_post(
        post: &mut Post,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        abort E_NOT_IMPLEMENTED;
    }

    public fun add_comment(
        post: &mut Post,
        content: String,
        uri: Option<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        abort E_NOT_IMPLEMENTED;
    }


}

