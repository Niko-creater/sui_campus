#[test_only]
module sui_campus::sui_campus_tests {
    use sui::test_scenario::{Self};
    use sui::clock::{Self, Clock};
    use sui::package::{Self};
    use std::string::{Self};
    use sui_campus::forum::{Self, Forum};

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
            let uri = string::utf8(b"https://example.com/post");
            
            forum::create_post(&mut forum, title, uri, &clock, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(forum);
            test_scenario::return_shared(clock);
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
        
    //     // 初始化论坛
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         // 尝试创建空标题的帖子
    //         let empty_title = string::utf8(b"");
    //         let uri = string::utf8(b"https://example.com/post");
            
    //         forum::create_post(&mut forum, empty_title, uri, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     test_scenario::end(scenario);
    // }

    // #[test]
    // #[expected_failure(abort_code = sui_campus::forum::E_CONTENT_EMPTY)]
    // fun test_create_post_empty_uri() {
    //     let mut scenario = test_scenario::begin(ADMIN);
    //     let publisher = package::claim(Publisher {}, test_scenario::ctx(&mut scenario));
    //     let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    //     clock::set_for_testing(&mut clock, 1000);
        
    //     // 初始化论坛
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         // 尝试创建空URI的帖子
    //         let title = string::utf8(b"Test Post Title");
    //         let empty_uri = string::utf8(b"");
            
    //         forum::create_post(&mut forum, title, empty_uri, &clock, test_scenario::ctx(&mut scenario));
            
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
        
    //     // 初始化论坛
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     // 创建第一个帖子
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title1 = string::utf8(b"First Post");
    //         let uri1 = string::utf8(b"https://example.com/post1");
            
    //         forum::create_post(&mut forum, title1, uri1, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     // 创建第二个帖子
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title2 = string::utf8(b"Second Post");
    //         let uri2 = string::utf8(b"https://example.com/post2");
            
    //         forum::create_post(&mut forum, title2, uri2, &clock, test_scenario::ctx(&mut scenario));
            
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
        
    //     // 初始化论坛
    //     {
    //         forum::init_forum(&publisher, test_scenario::ctx(&mut scenario));
    //     };
        
    //     // 用户1创建帖子
    //     test_scenario::next_tx(&mut scenario, USER);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title = string::utf8(b"User 1 Post");
    //         let uri = string::utf8(b"https://example.com/user1");
            
    //         forum::create_post(&mut forum, title, uri, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     // 用户2创建帖子
    //     test_scenario::next_tx(&mut scenario, USER2);
    //     {
    //         let mut forum = test_scenario::take_shared<Forum>(&scenario);
    //         let clock = test_scenario::take_shared<Clock>(&scenario);
            
    //         let title = string::utf8(b"User 2 Post");
    //         let uri = string::utf8(b"https://example.com/user2");
            
    //         forum::create_post(&mut forum, title, uri, &clock, test_scenario::ctx(&mut scenario));
            
    //         test_scenario::return_shared(forum);
    //         test_scenario::return_shared(clock);
    //     };
        
    //     test_scenario::end(scenario);
    // }
}
