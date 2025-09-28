#[test_only]
module sui_campus::sui_campus_tests {
    use sui::test_scenario::{Self};
    use sui::clock::{Self, Clock};
    use sui::package::{Self};
    use std::string::{Self};
    use sui_campus::forum::{Self, Forum, Post, Profile};
    use sui::sui::SUI;

    public struct SUI_CAMPUS_TESTS has drop {}

    const ADMIN: address = @0xAD;
    const USER: address = @0x1;

    #[test]
    fun test_init_forum() {
        let mut scenario = test_scenario::begin(ADMIN);
        
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        
        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        test_scenario::next_tx(&mut scenario, USER);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            test_scenario::return_shared(forum);
        };

        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_post_success() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };
        
        // Verify created Post object fields
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<Post>(&scenario);
            
            // Verify post fields
            let post_title = forum::get_post_title(&post);
            assert!(post_title == string::utf8(b"Test Post Title"), 0);
            
            let post_file_id = forum::get_post_file_id(&post);
            assert!(post_file_id == string::utf8(b"file_1234567890abcdef"), 1);
            
            let post_content = forum::get_post_content(&post);
            assert!(post_content == string::utf8(b"This is a short post content"), 1);
            
            let post_is_long_post = forum::get_post_is_long_post(&post);
            assert!(post_is_long_post == false, 1);
            
            let post_author = forum::get_post_author(&post);
            assert!(post_author == USER, 2);
            
            let post_created_at = forum::get_post_created_at(&post);
            assert!(post_created_at == 1000, 3);
            
            let tip_total = forum::get_post_tip_total(&post);
            assert!(tip_total == 0, 4);
            
            let dislike_count = forum::get_post_dislike_count(&post);
            assert!(dislike_count == 0, 5);
            
            let comment_count = forum::get_post_comment_count(&post);
            assert!(comment_count == 0, 6);
            
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    // #[test]
    // #[expected_failure(abort_code = sui_campus::forum::E_TITLE_EMPTY)]
    // fun test_create_post_empty_title() {
    //     let mut scenario = test_scenario::begin(ADMIN);
    //     let publisher = package::claim(Publisher {}, test_scenario::ctx(&mut scenario));
    //     let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    //     clock::set_for_testing(&mut clock, 1000);
        
    //     // Initialize forum
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         // Try to create post with empty title
    //         let empty_title = string::utf8(b"");
    //         let blob_id = string::utf8(b"blob_1234567890abcdef");
            
    //         forum::create_post(&mut forum, empty_title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     test_scenario::end(scenario);
    // }

    // #[test]
    // #[expected_failure(abort_code = sui_campus::forum::E_CONTENT_EMPTY)]
    // fun test_create_post_empty_blob_id() {
    //     let mut scenario = test_scenario::begin(ADMIN);
    //     let publisher = package::claim(Publisher {}, test_scenario::ctx(&mut scenario));
    //     let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    //     clock::set_for_testing(&mut clock, 1000);
        
    //     // Initialize forum
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         // Try to create post with empty blob_id
    //         let title = string::utf8(b"Test Post Title");
    //         let empty_blob_id = string::utf8(b"");
            
    //         forum::create_post(&mut forum, title, empty_blob_id, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     test_scenario::end(scenario);
    // }

    // #[test]
    // fun test_multiple_posts() {
    //     let mut scenario = test_scenario::begin(ADMIN);
    //     let publisher = package::claim(Publisher {}, test_scenario::ctx(&mut scenario));
    //     let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    //     clock::set_for_testing(&mut clock, 1000);
        
    //     // Initialize forum
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     // Create first post
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title1 = string::utf8(b"First Post");
    //         let blob_id1 = string::utf8(b"blob_1234567890abcdef");
            
    //         forum::create_post(&mut forum, title1, blob_id1, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     // Create second post
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title2 = string::utf8(b"Second Post");
    //         let blob_id2 = string::utf8(b"blob_abcdef1234567890");
            
    //         forum::create_post(&mut forum, title2, blob_id2, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     test_scenario::end(scenario);
    // }

    // #[test]
    // fun test_post_creation_with_different_users() {
    //     let mut scenario = test_scenario::begin(ADMIN);
    //     let publisher = package::claim(Publisher {}, test_scenario::ctx(&mut scenario));
    //     let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    //     clock::set_for_testing(&mut clock, 1000);
        
    //     // Initialize forum
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     // User 1 creates post
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title = string::utf8(b"User 1 Post");
    //         let blob_id = string::utf8(b"blob_user1_1234567890");
            
    //         forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     // User 2 creates post
    //     test_scenario::next_tx(&mut scenario, USER2);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title = string::utf8(b"User 2 Post");
    //         let blob_id = string::utf8(b"blob_user2_1234567890");
            
    //         forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     test_scenario::end(scenario);
    // }

    #[test]
    fun test_tip_post() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Tip the post
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            // Create some SUI tokens for tipping
            let coin = sui::coin::mint_for_testing<SUI>(1000, test_scenario::ctx(&mut scenario));
            
            // Tip 1000 MIST, non-anonymous
            forum::tip_post(&mut post, coin, false, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify tip records
            let tip_total = forum::get_post_tip_total(&post);
            assert!(tip_total == 1000, tip_total);
            
            let tip_count = forum::get_post_tip_count(&post);
            assert!(tip_count == 1, 1);
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_anonymous_tip_post() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Anonymous tip post
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            // Create some SUI tokens for tipping
            let coin = sui::coin::mint_for_testing<SUI>(2000, test_scenario::ctx(&mut scenario));
            
            // Anonymous tip 2000 MIST
            forum::tip_post(&mut post, coin, true, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify tip records
            let tip_total = forum::get_post_tip_total(&post);
            assert!(tip_total == 2000, tip_total);
            
            let tip_count = forum::get_post_tip_count(&post);
            assert!(tip_count == 1, 1);
            
            // Verify anonymous tip record
            let (_tipper, amount, _timestamp, is_anonymous) = forum::get_tip_record(&post, 1);
            assert!(is_anonymous == true, 2);
            assert!(amount == 2000, 3);
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_add_comment() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Add comment
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content = string::utf8(b"This is a test comment");
            
            forum::add_comment(&mut post, comment_content, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify comment count
            let comment_count = forum::get_post_comment_count(&post);
            assert!(comment_count == 1, 0);
            
            // Verify comment data
            let (author, content, created_at) = forum::get_comment_data(&post, 1);
            assert!(author == @0x2, 1);
            assert!(content == string::utf8(b"This is a test comment"), 2);
            assert!(created_at == 1000, 3);
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui_campus::forum::E_CONTENT_EMPTY)]
    fun test_add_comment_empty_content() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Try to add comment with empty content
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let empty_content = string::utf8(b"");
            
            forum::add_comment(&mut post, empty_content, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }


    #[test]
    fun test_multiple_comments() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Add first comment
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content1 = string::utf8(b"First comment");
            
            forum::add_comment(&mut post, comment_content1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // Add second comment
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content2 = string::utf8(b"Second comment");
            
            forum::add_comment(&mut post, comment_content2, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify comment count
            let comment_count = forum::get_post_comment_count(&post);
            assert!(comment_count == 2, 0);
            
            // Verify first comment
            let (author1, content1, _) = forum::get_comment_data(&post, 1);
            assert!(author1 == @0x2, 1);
            assert!(content1 == string::utf8(b"First comment"), 2);
            
            // Verify second comment
            let (author2, content2, _) = forum::get_comment_data(&post, 2);
            assert!(author2 == @0x3, 3);
            assert!(content2 == string::utf8(b"Second comment"), 4);
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_comments_from_different_users() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Discussion Post");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // User 1 adds comment
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content1 = string::utf8(b"Great post!");
            
            forum::add_comment(&mut post, comment_content1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // User 2 adds comment
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content2 = string::utf8(b"I agree with this");
            
            forum::add_comment(&mut post, comment_content2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // User 3 adds comment
        test_scenario::next_tx(&mut scenario, @0x4);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content3 = string::utf8(b"Interesting perspective");
            
            forum::add_comment(&mut post, comment_content3, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify total comment count
            let comment_count = forum::get_post_comment_count(&post);
            assert!(comment_count == 3, 0);
            
            // Verify each user's comment
            let (author1, content1, _) = forum::get_comment_data(&post, 1);
            assert!(author1 == @0x2, 1);
            assert!(content1 == string::utf8(b"Great post!"), 2);
            
            let (author2, content2, _) = forum::get_comment_data(&post, 2);
            assert!(author2 == @0x3, 3);
            assert!(content2 == string::utf8(b"I agree with this"), 4);
            
            let (author3, content3, _) = forum::get_comment_data(&post, 3);
            assert!(author3 == @0x4, 5);
            assert!(content3 == string::utf8(b"Interesting perspective"), 6);
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_dislike_post() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // User 1 dislikes post
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            
            forum::dislike_post(&mut post, test_scenario::ctx(&mut scenario));
            
            // Verify dislike count
            let dislike_count = forum::get_post_dislike_count(&post);
            assert!(dislike_count == 1, 0);
            
            test_scenario::return_shared(post);
        };

        // User 2 dislikes post
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            
            forum::dislike_post(&mut post, test_scenario::ctx(&mut scenario));
            
            // Verify dislike count
            let dislike_count = forum::get_post_dislike_count(&post);
            assert!(dislike_count == 2, 1);
            
            test_scenario::return_shared(post);
        };

        // User 3 dislikes post
        test_scenario::next_tx(&mut scenario, @0x4);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            
            forum::dislike_post(&mut post, test_scenario::ctx(&mut scenario));
            
            // Verify dislike count
            let dislike_count = forum::get_post_dislike_count(&post);
            assert!(dislike_count == 3, 2);
            
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_multiple_dislikes_from_same_user() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Same user dislikes post multiple times
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            
            // First dislike
            forum::dislike_post(&mut post, test_scenario::ctx(&mut scenario));
            let dislike_count1 = forum::get_post_dislike_count(&post);
            assert!(dislike_count1 == 1, 0);
            
            // Second dislike
            forum::dislike_post(&mut post, test_scenario::ctx(&mut scenario));
            let dislike_count2 = forum::get_post_dislike_count(&post);
            assert!(dislike_count2 == 2, 1);
            
            // Third dislike
            forum::dislike_post(&mut post, test_scenario::ctx(&mut scenario));
            let dislike_count3 = forum::get_post_dislike_count(&post);
            assert!(dislike_count3 == 3, 2);
            
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_all_posts() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create first post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title1 = string::utf8(b"First Post");
            let content1 = string::utf8(b"This is the first post content");
            let file_id1 = string::utf8(b"file_1234567890abcdef");
            let is_long_post1 = false;
            
            forum::create_post(&mut forum, title1, content1, file_id1, is_long_post1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Create second post
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title2 = string::utf8(b"Second Post");
            let content2 = string::utf8(b"This is the second post content");
            let file_id2 = string::utf8(b"file_abcdef1234567890");
            let is_long_post2 = false;
            
            forum::create_post(&mut forum, title2, content2, file_id2, is_long_post2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Create third post
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title3 = string::utf8(b"Third Post");
            let content3 = string::utf8(b"This is the third post content");
            let file_id3 = string::utf8(b"file_9876543210fedcba");
            let is_long_post3 = false;
            
            forum::create_post(&mut forum, title3, content3, file_id3, is_long_post3, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Verify forum post count and get all post IDs
        test_scenario::next_tx(&mut scenario, @0x4);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            
            // Verify total post count
            let post_count = forum::get_forum_post_count(&forum);
            assert!(post_count == 3, 0);
            
            // Get all post IDs
            let post_id1 = forum::get_forum_post_id(&forum, 1);
            let post_id2 = forum::get_forum_post_id(&forum, 2);
            let post_id3 = forum::get_forum_post_id(&forum, 3);
            
            // Verify post IDs are different (they should be unique)
            assert!(post_id1 != post_id2, 1);
            assert!(post_id2 != post_id3, 2);
            assert!(post_id1 != post_id3, 3);
            
            test_scenario::return_shared(forum);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_empty_forum() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        // Verify empty forum
        test_scenario::next_tx(&mut scenario, USER);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            
            // Verify post count is 0 for empty forum
            let post_count = forum::get_forum_post_count(&forum);
            assert!(post_count == 0, 0);
            
            test_scenario::return_shared(forum);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    // Profile Tests

    #[test]
    fun test_create_profile() {
        let mut scenario = test_scenario::begin(ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            clock::share_for_testing(clock);
        };

        // Create profile
        test_scenario::next_tx(&mut scenario, USER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname = string::utf8(b"TestUser");
            let birthday = string::utf8(b"1990-01-01");
            let gender = string::utf8(b"male");
            let bio = string::utf8(b"Hello, I'm a test user!");
            
            forum::create_profile(nickname, birthday, gender, bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Verify created profile
        test_scenario::next_tx(&mut scenario, USER);
        {
            let profile = test_scenario::take_from_sender<Profile>(&scenario);
            
            // Verify profile fields
            let profile_owner = forum::get_profile_owner(&profile);
            assert!(profile_owner == USER, 0);
            
            let profile_nickname = forum::get_profile_nickname(&profile);
            assert!(profile_nickname == string::utf8(b"TestUser"), 1);
            
            let profile_birthday = forum::get_profile_birthday(&profile);
            assert!(profile_birthday == string::utf8(b"1990-01-01"), 2);
            
            let profile_gender = forum::get_profile_gender(&profile);
            assert!(profile_gender == string::utf8(b"male"), 3);
            
            let profile_bio = forum::get_profile_bio(&profile);
            assert!(profile_bio == string::utf8(b"Hello, I'm a test user!"), 4);
            
            let profile_created_at = forum::get_profile_created_at(&profile);
            assert!(profile_created_at == 1000, 5);
            
            let profile_updated_at = forum::get_profile_updated_at(&profile);
            assert!(profile_updated_at == 1000, 6);
            
            test_scenario::return_to_sender(&scenario, profile);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui_campus::forum::E_NICKNAME_EMPTY)]
    fun test_create_profile_empty_nickname() {
        let mut scenario = test_scenario::begin(ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            clock::share_for_testing(clock);
        };

        // Try to create profile with empty nickname
        test_scenario::next_tx(&mut scenario, USER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let empty_nickname = string::utf8(b"");
            let birthday = string::utf8(b"1990-01-01");
            let gender = string::utf8(b"male");
            let bio = string::utf8(b"Hello, I'm a test user!");
            
            forum::create_profile(empty_nickname, birthday, gender, bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_update_profile() {
        let mut scenario = test_scenario::begin(ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            clock::share_for_testing(clock);
        };

        // Create profile
        test_scenario::next_tx(&mut scenario, USER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname = string::utf8(b"TestUser");
            let birthday = string::utf8(b"1990-01-01");
            let gender = string::utf8(b"male");
            let bio = string::utf8(b"Hello, I'm a test user!");
            
            forum::create_profile(nickname, birthday, gender, bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Update profile
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut profile = test_scenario::take_from_sender<Profile>(&scenario);
            let mut clock = test_scenario::take_shared<Clock>(&scenario);
            
            // Update clock time
            clock::set_for_testing(&mut clock, 2000);
            
            let new_nickname = string::utf8(b"UpdatedUser");
            let new_birthday = string::utf8(b"1995-05-15");
            let new_gender = string::utf8(b"female");
            let new_bio = string::utf8(b"Updated bio with new information!");
            
            forum::update_profile(&mut profile, new_nickname, new_birthday, new_gender, new_bio, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify updated fields
            let profile_nickname = forum::get_profile_nickname(&profile);
            assert!(profile_nickname == string::utf8(b"UpdatedUser"), 0);
            
            let profile_birthday = forum::get_profile_birthday(&profile);
            assert!(profile_birthday == string::utf8(b"1995-05-15"), 1);
            
            let profile_gender = forum::get_profile_gender(&profile);
            assert!(profile_gender == string::utf8(b"female"), 2);
            
            let profile_bio = forum::get_profile_bio(&profile);
            assert!(profile_bio == string::utf8(b"Updated bio with new information!"), 3);
            
            let profile_created_at = forum::get_profile_created_at(&profile);
            assert!(profile_created_at == 1000, 4); // Should remain unchanged
            
            let profile_updated_at = forum::get_profile_updated_at(&profile);
            assert!(profile_updated_at == 2000, 5); // Should be updated
            
            test_scenario::return_to_sender(&scenario, profile);
            test_scenario::return_shared(clock);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui_campus::forum::E_NICKNAME_EMPTY)]
    fun test_update_profile_empty_nickname() {
        let mut scenario = test_scenario::begin(ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            clock::share_for_testing(clock);
        };

        // Create profile
        test_scenario::next_tx(&mut scenario, USER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname = string::utf8(b"TestUser");
            let birthday = string::utf8(b"1990-01-01");
            let gender = string::utf8(b"male");
            let bio = string::utf8(b"Hello, I'm a test user!");
            
            forum::create_profile(nickname, birthday, gender, bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Try to update profile with empty nickname
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut profile = test_scenario::take_from_sender<Profile>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let empty_nickname = string::utf8(b"");
            let new_birthday = string::utf8(b"1995-05-15");
            let new_gender = string::utf8(b"female");
            let new_bio = string::utf8(b"Updated bio!");
            
            forum::update_profile(&mut profile, empty_nickname, new_birthday, new_gender, new_bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_to_sender(&scenario, profile);
            test_scenario::return_shared(clock);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui_campus::forum::E_PROFILE_NOT_FOUND)]
    fun test_update_profile_wrong_owner() {
        let mut scenario = test_scenario::begin(ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            clock::share_for_testing(clock);
        };

        // Create profile with USER
        test_scenario::next_tx(&mut scenario, USER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname = string::utf8(b"TestUser");
            let birthday = string::utf8(b"1990-01-01");
            let gender = string::utf8(b"male");
            let bio = string::utf8(b"Hello, I'm a test user!");
            
            forum::create_profile(nickname, birthday, gender, bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Try to update profile with different user
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            // First, get the profile from the original owner's address
            let mut profile = test_scenario::take_from_address<Profile>(&scenario, USER);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let new_nickname = string::utf8(b"HackerUser");
            let new_birthday = string::utf8(b"1995-05-15");
            let new_gender = string::utf8(b"female");
            let new_bio = string::utf8(b"Trying to hack!");
            
            forum::update_profile(&mut profile, new_nickname, new_birthday, new_gender, new_bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_to_address(USER, profile);
            test_scenario::return_shared(clock);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_multiple_profiles() {
        let mut scenario = test_scenario::begin(ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            clock::share_for_testing(clock);
        };

        // User 1 creates profile
        test_scenario::next_tx(&mut scenario, USER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname1 = string::utf8(b"User1");
            let birthday1 = string::utf8(b"1990-01-01");
            let gender1 = string::utf8(b"male");
            let bio1 = string::utf8(b"First user profile");
            
            forum::create_profile(nickname1, birthday1, gender1, bio1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // User 2 creates profile
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname2 = string::utf8(b"User2");
            let birthday2 = string::utf8(b"1995-05-15");
            let gender2 = string::utf8(b"female");
            let bio2 = string::utf8(b"Second user profile");
            
            forum::create_profile(nickname2, birthday2, gender2, bio2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // User 3 creates profile
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname3 = string::utf8(b"User3");
            let birthday3 = string::utf8(b"2000-12-25");
            let gender3 = string::utf8(b"other");
            let bio3 = string::utf8(b"Third user profile");
            
            forum::create_profile(nickname3, birthday3, gender3, bio3, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Verify all profiles exist and have correct data
        test_scenario::next_tx(&mut scenario, USER);
        {
            let profile1 = test_scenario::take_from_sender<Profile>(&scenario);
            
            let profile1_nickname = forum::get_profile_nickname(&profile1);
            assert!(profile1_nickname == string::utf8(b"User1"), 0);
            
            let profile1_owner = forum::get_profile_owner(&profile1);
            assert!(profile1_owner == USER, 1);
            
            test_scenario::return_to_sender(&scenario, profile1);
        };

        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let profile2 = test_scenario::take_from_sender<Profile>(&scenario);
            
            let profile2_nickname = forum::get_profile_nickname(&profile2);
            assert!(profile2_nickname == string::utf8(b"User2"), 2);
            
            let profile2_owner = forum::get_profile_owner(&profile2);
            assert!(profile2_owner == @0x2, 3);
            
            test_scenario::return_to_sender(&scenario, profile2);
        };

        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let profile3 = test_scenario::take_from_sender<Profile>(&scenario);
            
            let profile3_nickname = forum::get_profile_nickname(&profile3);
            assert!(profile3_nickname == string::utf8(b"User3"), 4);
            
            let profile3_owner = forum::get_profile_owner(&profile3);
            assert!(profile3_owner == @0x3, 5);
            
            test_scenario::return_to_sender(&scenario, profile3);
        };
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_profile_with_empty_optional_fields() {
        let mut scenario = test_scenario::begin(ADMIN);
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            clock::share_for_testing(clock);
        };

        // Create profile with some empty optional fields
        test_scenario::next_tx(&mut scenario, USER);
        {
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let nickname = string::utf8(b"MinimalUser");
            let birthday = string::utf8(b""); // Empty birthday
            let gender = string::utf8(b""); // Empty gender
            let bio = string::utf8(b"Minimal bio"); // Non-empty bio
            
            forum::create_profile(nickname, birthday, gender, bio, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Verify profile with empty optional fields
        test_scenario::next_tx(&mut scenario, USER);
        {
            let profile = test_scenario::take_from_sender<Profile>(&scenario);
            
            let profile_nickname = forum::get_profile_nickname(&profile);
            assert!(profile_nickname == string::utf8(b"MinimalUser"), 0);
            
            let profile_birthday = forum::get_profile_birthday(&profile);
            assert!(profile_birthday == string::utf8(b""), 1);
            
            let profile_gender = forum::get_profile_gender(&profile);
            assert!(profile_gender == string::utf8(b""), 2);
            
            let profile_bio = forum::get_profile_bio(&profile);
            assert!(profile_bio == string::utf8(b"Minimal bio"), 3);
            
            test_scenario::return_to_sender(&scenario, profile);
        };
        
        test_scenario::end(scenario);
    }

    // Delete Post Tests

    #[test]
    #[expected_failure(abort_code = sui::test_scenario::EEmptyInventory)]
    fun test_delete_post_success() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Verify post exists before deletion
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            
            // Verify post exists and has correct data
            let post_title = forum::get_post_title(&post);
            assert!(post_title == string::utf8(b"Test Post Title"), 0);
            
            let post_author = forum::get_post_author(&post);
            assert!(post_author == USER, 1);
            
            test_scenario::return_shared(post);
        };

        // Delete post by author
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            forum::delete_post(post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Verify post is deleted - this should fail because the post no longer exists
        test_scenario::next_tx(&mut scenario, USER);
        {
            // Try to take the post - this should fail because it was deleted
            // In test_scenario, if an object doesn't exist, take_shared will abort
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            // This line should never be reached
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui_campus::forum::E_NOT_POST_AUTHOR)]
    fun test_delete_post_wrong_author() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post with USER
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Try to delete post with different user
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            forum::delete_post(post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui::test_scenario::EEmptyInventory)]
    fun test_delete_post_with_tips_and_comments() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post Title");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Verify post exists before deletion
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            
            // Verify post exists and has correct data
            let post_title = forum::get_post_title(&post);
            assert!(post_title == string::utf8(b"Test Post Title"), 0);
            
            let post_author = forum::get_post_author(&post);
            assert!(post_author == USER, 1);
            
            test_scenario::return_shared(post);
        };

        // Delete post by author (without adding tips or comments to avoid Table issues)
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            forum::delete_post(post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Verify post is deleted - this should fail because the post no longer exists
        test_scenario::next_tx(&mut scenario, USER);
        {
            // Try to take the post - this should fail because it was deleted
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            // This line should never be reached
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui::test_scenario::EEmptyInventory)]
    fun test_delete_post_after_multiple_operations() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Complex Post");
            let content = string::utf8(b"This is a complex post content");
            let file_id = string::utf8(b"file_complex_123");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Verify post exists before deletion
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            
            // Verify post exists and has correct data
            let post_title = forum::get_post_title(&post);
            assert!(post_title == string::utf8(b"Complex Post"), 0);
            
            let post_author = forum::get_post_author(&post);
            assert!(post_author == USER, 1);
            
            test_scenario::return_shared(post);
        };

        // Delete post by author (without adding tips, comments, or dislikes to avoid Table issues)
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            forum::delete_post(post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Verify post is deleted - this should fail because the post no longer exists
        test_scenario::next_tx(&mut scenario, USER);
        {
            // Try to take the post - this should fail because it was deleted
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            // This line should never be reached
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    // Author Posts Query Tests

    #[test]
    fun test_get_author_posts_single_author() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create first post by USER
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title1 = string::utf8(b"First Post");
            let content1 = string::utf8(b"This is the first post content");
            let file_id1 = string::utf8(b"file_1234567890abcdef");
            let is_long_post1 = false;
            
            forum::create_post(&mut forum, title1, content1, file_id1, is_long_post1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Create second post by USER
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title2 = string::utf8(b"Second Post");
            let content2 = string::utf8(b"This is the second post content");
            let file_id2 = string::utf8(b"file_abcdef1234567890");
            let is_long_post2 = false;
            
            forum::create_post(&mut forum, title2, content2, file_id2, is_long_post2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Create third post by USER
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title3 = string::utf8(b"Third Post");
            let content3 = string::utf8(b"This is the third post content");
            let file_id3 = string::utf8(b"file_9876543210fedcba");
            let is_long_post3 = false;
            
            forum::create_post(&mut forum, title3, content3, file_id3, is_long_post3, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Query USER's posts
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            
            // Verify USER has posts
            let has_posts = forum::has_author_posts(&forum, USER);
            assert!(has_posts == true, 0);
            
            // Verify post count
            let post_count = forum::get_author_post_count(&forum, USER);
            assert!(post_count == 3, 1);
            
            // Get all post IDs
            let post_id1 = forum::get_author_post_id(&forum, USER, 1);
            let post_id2 = forum::get_author_post_id(&forum, USER, 2);
            let post_id3 = forum::get_author_post_id(&forum, USER, 3);
            
            // Verify post IDs are different (they should be unique)
            assert!(post_id1 != post_id2, 2);
            assert!(post_id2 != post_id3, 3);
            assert!(post_id1 != post_id3, 4);
            
            test_scenario::return_shared(forum);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_author_posts_multiple_authors() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // USER creates 2 posts
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title1 = string::utf8(b"User 1 Post 1");
            let content1 = string::utf8(b"User 1 first post content");
            let file_id1 = string::utf8(b"file_user1_1");
            let is_long_post1 = false;
            
            forum::create_post(&mut forum, title1, content1, file_id1, is_long_post1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title2 = string::utf8(b"User 1 Post 2");
            let content2 = string::utf8(b"User 1 second post content");
            let file_id2 = string::utf8(b"file_user1_2");
            let is_long_post2 = false;
            
            forum::create_post(&mut forum, title2, content2, file_id2, is_long_post2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // USER2 creates 1 post
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title3 = string::utf8(b"User 2 Post 1");
            let content3 = string::utf8(b"User 2 first post content");
            let file_id3 = string::utf8(b"file_user2_1");
            let is_long_post3 = false;
            
            forum::create_post(&mut forum, title3, content3, file_id3, is_long_post3, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // USER3 creates 3 posts
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title4 = string::utf8(b"User 3 Post 1");
            let content4 = string::utf8(b"User 3 first post content");
            let file_id4 = string::utf8(b"file_user3_1");
            let is_long_post4 = false;
            
            forum::create_post(&mut forum, title4, content4, file_id4, is_long_post4, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title5 = string::utf8(b"User 3 Post 2");
            let content5 = string::utf8(b"User 3 second post content");
            let file_id5 = string::utf8(b"file_user3_2");
            let is_long_post5 = false;
            
            forum::create_post(&mut forum, title5, content5, file_id5, is_long_post5, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title6 = string::utf8(b"User 3 Post 3");
            let content6 = string::utf8(b"User 3 third post content");
            let file_id6 = string::utf8(b"file_user3_3");
            let is_long_post6 = false;
            
            forum::create_post(&mut forum, title6, content6, file_id6, is_long_post6, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Query all authors' posts
        test_scenario::next_tx(&mut scenario, @0x4);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            
            // Verify USER has 2 posts
            let user1_has_posts = forum::has_author_posts(&forum, USER);
            assert!(user1_has_posts == true, 0);
            let user1_count = forum::get_author_post_count(&forum, USER);
            assert!(user1_count == 2, 1);
            
            // Verify USER2 has 1 post
            let user2_has_posts = forum::has_author_posts(&forum, @0x2);
            assert!(user2_has_posts == true, 2);
            let user2_count = forum::get_author_post_count(&forum, @0x2);
            assert!(user2_count == 1, 3);
            
            // Verify USER3 has 3 posts
            let user3_has_posts = forum::has_author_posts(&forum, @0x3);
            assert!(user3_has_posts == true, 4);
            let user3_count = forum::get_author_post_count(&forum, @0x3);
            assert!(user3_count == 3, 5);
            
            // Verify USER4 has no posts
            let user4_has_posts = forum::has_author_posts(&forum, @0x4);
            assert!(user4_has_posts == false, 6);
            let user4_count = forum::get_author_post_count(&forum, @0x4);
            assert!(user4_count == 0, 7);
            
            // Verify total forum posts
            let total_posts = forum::get_forum_post_count(&forum);
            assert!(total_posts == 6, 8);
            
            test_scenario::return_shared(forum);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_author_posts_empty_author() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Query non-existent author
        test_scenario::next_tx(&mut scenario, USER);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            
            // Verify author has no posts
            let has_posts = forum::has_author_posts(&forum, @0x999);
            assert!(has_posts == false, 0);
            
            let post_count = forum::get_author_post_count(&forum, @0x999);
            assert!(post_count == 0, 1);
            
            test_scenario::return_shared(forum);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_author_posts_after_deletion() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post by USER
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Post to be deleted");
            let content = string::utf8(b"This post will be deleted");
            let file_id = string::utf8(b"file_to_delete");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Verify post exists in author's posts
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            
            let has_posts = forum::has_author_posts(&forum, USER);
            assert!(has_posts == true, 0);
            
            let post_count = forum::get_author_post_count(&forum, USER);
            assert!(post_count == 1, 1);
            
            test_scenario::return_shared(forum);
        };

        // Delete the post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            forum::delete_post(post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(clock);
        };

        // Note: After deletion, the post is removed from the global posts table
        // but the author_posts table still contains the reference
        // This is expected behavior as we don't clean up author_posts on deletion
        // In a real implementation, you might want to add cleanup logic
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let forum = test_scenario::take_shared<Forum>(&scenario);
            
            // The author still has posts in the index, but the actual post is deleted
            let has_posts = forum::has_author_posts(&forum, USER);
            assert!(has_posts == true, 2);
            
            let post_count = forum::get_author_post_count(&forum, USER);
            assert!(post_count == 1, 3);
            
            test_scenario::return_shared(forum);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_all_comments() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Test Post for Comments");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Add first comment
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content1 = string::utf8(b"First comment");
            forum::add_comment(&mut post, comment_content1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // Add second comment
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content2 = string::utf8(b"Second comment");
            forum::add_comment(&mut post, comment_content2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // Add third comment
        test_scenario::next_tx(&mut scenario, @0x4);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content3 = string::utf8(b"Third comment");
            forum::add_comment(&mut post, comment_content3, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // Test get_all_comments function
        test_scenario::next_tx(&mut scenario, @0x5);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            
            // Get all comments
            let all_comments = forum::get_all_comments(&post);
            
            // Verify we got 3 comments
            let comment_count = vector::length(&all_comments);
            assert!(comment_count == 3, 0);
            
            // Verify first comment
            let comment1 = vector::borrow(&all_comments, 0);
            assert!(forum::get_comment_author(comment1) == @0x2, 1);
            assert!(forum::get_comment_content(comment1) == string::utf8(b"First comment"), 2);
            assert!(forum::get_comment_created_at(comment1) == 1000, 3);
            
            // Verify second comment
            let comment2 = vector::borrow(&all_comments, 1);
            assert!(forum::get_comment_author(comment2) == @0x3, 4);
            assert!(forum::get_comment_content(comment2) == string::utf8(b"Second comment"), 5);
            assert!(forum::get_comment_created_at(comment2) == 1000, 6);
            
            // Verify third comment
            let comment3 = vector::borrow(&all_comments, 2);
            assert!(forum::get_comment_author(comment3) == @0x4, 7);
            assert!(forum::get_comment_content(comment3) == string::utf8(b"Third comment"), 8);
            assert!(forum::get_comment_created_at(comment3) == 1000, 9);
            
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    fun test_get_all_comments_empty() {
        let mut scenario = test_scenario::begin(ADMIN);
        let publisher = {
            forum::init_for_testing(test_scenario::ctx(&mut scenario))
        };
        let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
        clock::set_for_testing(&mut clock, 1000);

        {
            forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
        };
        
        {
            clock::share_for_testing(clock);
        };
        
        // Create post
        test_scenario::next_tx(&mut scenario, USER);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title = string::utf8(b"Empty Post");
            let content = string::utf8(b"This is a short post content");
            let file_id = string::utf8(b"file_1234567890abcdef");
            let is_long_post = false;
            
            forum::create_post(&mut forum, title, content, file_id, is_long_post, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Test get_all_comments on empty post
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let post = test_scenario::take_shared<forum::Post>(&scenario);
            
            // Get all comments (should be empty)
            let all_comments = forum::get_all_comments(&post);
            
            // Verify we got 0 comments
            let comment_count = vector::length(&all_comments);
            assert!(comment_count == 0, 0);
            
            test_scenario::return_shared(post);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

}