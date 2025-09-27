#[test_only]
module sui_campus::sui_campus_tests {
    use sui::test_scenario::{Self};
    use sui::clock::{Self, Clock};
    use sui::package::{Self};
    use std::string::{Self};
    use sui_campus::forum::{Self, Forum, Post};
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
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
            
            let post_blob_id = forum::get_post_blob_id(&post);
            assert!(post_blob_id == string::utf8(b"blob_1234567890abcdef"), 1);
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Add comment
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content = string::utf8(b"This is a test comment");
            let comment_blob_id = string::utf8(b"comment_blob_1234567890");
            
            forum::add_comment(&mut post, comment_content, comment_blob_id, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify comment count
            let comment_count = forum::get_post_comment_count(&post);
            assert!(comment_count == 1, 0);
            
            // Verify comment data
            let (author, content, blob_id, created_at) = forum::get_comment_data(&post, 1);
            assert!(author == @0x2, 1);
            assert!(content == string::utf8(b"This is a test comment"), 2);
            assert!(blob_id == string::utf8(b"comment_blob_1234567890"), 3);
            assert!(created_at == 1000, 4);
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Try to add comment with empty content
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let empty_content = string::utf8(b"");
            let comment_blob_id = string::utf8(b"comment_blob_1234567890");
            
            forum::add_comment(&mut post, empty_content, comment_blob_id, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };
        
        package::burn_publisher(publisher);
        
        test_scenario::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = sui_campus::forum::E_CONTENT_EMPTY)]
    fun test_add_comment_empty_blob_id() {
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Try to add comment with empty blob_id
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content = string::utf8(b"This is a test comment");
            let empty_blob_id = string::utf8(b"");
            
            forum::add_comment(&mut post, comment_content, empty_blob_id, &clock, test_scenario::ctx(&mut scenario));
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Add first comment
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content1 = string::utf8(b"First comment");
            let comment_blob_id1 = string::utf8(b"comment_blob_1");
            
            forum::add_comment(&mut post, comment_content1, comment_blob_id1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // Add second comment
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content2 = string::utf8(b"Second comment");
            let comment_blob_id2 = string::utf8(b"comment_blob_2");
            
            forum::add_comment(&mut post, comment_content2, comment_blob_id2, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify comment count
            let comment_count = forum::get_post_comment_count(&post);
            assert!(comment_count == 2, 0);
            
            // Verify first comment
            let (author1, content1, blob_id1, _) = forum::get_comment_data(&post, 1);
            assert!(author1 == @0x2, 1);
            assert!(content1 == string::utf8(b"First comment"), 2);
            assert!(blob_id1 == string::utf8(b"comment_blob_1"), 3);
            
            // Verify second comment
            let (author2, content2, blob_id2, _) = forum::get_comment_data(&post, 2);
            assert!(author2 == @0x3, 4);
            assert!(content2 == string::utf8(b"Second comment"), 5);
            assert!(blob_id2 == string::utf8(b"comment_blob_2"), 6);
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // User 1 adds comment
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content1 = string::utf8(b"Great post!");
            let comment_blob_id1 = string::utf8(b"comment_user1");
            
            forum::add_comment(&mut post, comment_content1, comment_blob_id1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // User 2 adds comment
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content2 = string::utf8(b"I agree with this");
            let comment_blob_id2 = string::utf8(b"comment_user2");
            
            forum::add_comment(&mut post, comment_content2, comment_blob_id2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(post);
            test_scenario::return_shared(clock);
        };

        // User 3 adds comment
        test_scenario::next_tx(&mut scenario, @0x4);
        {
            let mut post = test_scenario::take_shared<forum::Post>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let comment_content3 = string::utf8(b"Interesting perspective");
            let comment_blob_id3 = string::utf8(b"comment_user3");
            
            forum::add_comment(&mut post, comment_content3, comment_blob_id3, &clock, test_scenario::ctx(&mut scenario));
            
            // Verify total comment count
            let comment_count = forum::get_post_comment_count(&post);
            assert!(comment_count == 3, 0);
            
            // Verify each user's comment
            let (author1, content1, blob_id1, _) = forum::get_comment_data(&post, 1);
            assert!(author1 == @0x2, 1);
            assert!(content1 == string::utf8(b"Great post!"), 2);
            assert!(blob_id1 == string::utf8(b"comment_user1"), 3);
            
            let (author2, content2, blob_id2, _) = forum::get_comment_data(&post, 2);
            assert!(author2 == @0x3, 4);
            assert!(content2 == string::utf8(b"I agree with this"), 5);
            assert!(blob_id2 == string::utf8(b"comment_user2"), 6);
            
            let (author3, content3, blob_id3, _) = forum::get_comment_data(&post, 3);
            assert!(author3 == @0x4, 7);
            assert!(content3 == string::utf8(b"Interesting perspective"), 8);
            assert!(blob_id3 == string::utf8(b"comment_user3"), 9);
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
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
            let blob_id = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title, blob_id, &clock, test_scenario::ctx(&mut scenario));
            
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
            let blob_id1 = string::utf8(b"blob_1234567890abcdef");
            
            forum::create_post(&mut forum, title1, blob_id1, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Create second post
        test_scenario::next_tx(&mut scenario, @0x2);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title2 = string::utf8(b"Second Post");
            let blob_id2 = string::utf8(b"blob_abcdef1234567890");
            
            forum::create_post(&mut forum, title2, blob_id2, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
        };

        // Create third post
        test_scenario::next_tx(&mut scenario, @0x3);
        {
            let mut forum = test_scenario::take_shared<Forum>(&scenario);
            let clock = test_scenario::take_shared<Clock>(&scenario);
            
            let title3 = string::utf8(b"Third Post");
            let blob_id3 = string::utf8(b"blob_9876543210fedcba");
            
            forum::create_post(&mut forum, title3, blob_id3, &clock, test_scenario::ctx(&mut scenario));
            
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

}