# Sui Campus Forum

A decentralized student forum built on Sui blockchain, enabling students to post, interact, and trade without centralized administration.

## Project Structure

- **`app/`** - Frontend implementation (React + TypeScript)
- **`sui_campus/`** - Move smart contracts implementation

## Features

### ✅ Completed
- Short & long post creation
- Post tipping system
- Comment system
- Dislike-based post ranking
- User profiles with school verification

### 🚧 In Development
- Chat room functionality
- Advanced search features
- Auction system
- Enhanced long post content types
- Student trading marketplace

## Key Features

- **Decentralized**: No admin required, community-driven moderation
- **On-chain**: All activities recorded on Sui blockchain
- **Distributed Storage**: Long content stored on Walrus
- **Student-focused**: School email verification system
- **Interactive**: Tipping, disliking, and ranking system

## Configuration

Package ID and Forum Object ID are managed in `app/src/constants.ts`.

## Technology Stack

- **Blockchain**: Sui Move
- **Frontend**: React, TypeScript, Radix UI
- **Storage**: Walrus (distributed database)
- **Wallet**: Sui dApp Kit
