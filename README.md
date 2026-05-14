# AI Manga Creator

![AI Manga Creator](./client/public/promo-image.png)

## Overview

**AI Manga Creator** is a full-stack web application that transforms the latest news articles into professionally illustrated manga using artificial intelligence. Simply select a news story, and the application automatically generates a complete manga narrative, creates illustrated panels with visual consistency, adds dialogue, and produces a downloadable JPEG or shareable X (Twitter) post. This end-to-end automation streamlines the entire manga creation workflow, from news ingestion to final publication.

## Key Features

| Feature | Description |
|---------|-------------|
| **Automated News Ingestion** | Fetches the latest news articles from multiple sources in real-time; displays five curated stories for selection |
| **AI-Powered Story Generation** | Analyzes selected news content and generates three distinct plot proposals, each with unique narrative angles and themes |
| **Intelligent Panel Creation** | Automatically generates 4–6 manga panel sequences with detailed image prompts and narrative descriptions |
| **High-Quality Image Generation** | Leverages DALL-E 3 to create visually stunning manga-style illustrations; maintains visual consistency by referencing previous panels |
| **Real-Time Dialogue Editing** | Allows users to customize and refine dialogue for each panel with live preview |
| **Professional JPEG Export** | Composes panels into a single high-quality JPEG image with customizable layouts (2×2, 2×3, 3×2, or single-column) |
| **Gallery Management** | Saves completed manga projects to a personal gallery for future reference and reuse |
| **Social Media Sharing** | Enables one-click sharing of generated manga directly to X (Twitter) with automatic metadata |
| **Secure Authentication** | Implements Manus OAuth for secure user authentication and session management |
| **Character Consistency** | Allows users to define main and supporting characters with detailed appearance descriptions to ensure visual consistency throughout the manga |
| **Customizable Speech Bubbles** | Offers three speech bubble styles (round, square, jagged) with adjustable positioning (top, middle, bottom) |
| **Template System** | Save and reuse favorite manga styles as templates; browse public templates created by other users |
| **Multi-Language Support** | Full internationalization with English and Japanese UI options |

## Workflow

The application guides users through a structured five-step workflow designed for intuitive manga creation:

```
Select News → Generate Story → Create Panels → Edit Dialogue → Preview & Export
```

### Step 1: News Selection

Users browse five recently published news articles from diverse sources. Each article displays the headline, summary, source attribution, and publication date. Selecting an article advances to the story generation phase.

### Step 2: Story Generation

The AI analyzes the selected news article and proposes three distinct narrative interpretations. Each proposal includes a plot title, detailed plot description, estimated panel count, and key themes. Users can also define character appearances at this stage to ensure visual consistency across all panels. The application supports detailed character descriptions for both main protagonists and supporting characters, as well as preferred art styles (e.g., anime, fantasy, beautiful, cute).

### Step 3: Panel Creation

Based on the selected story, the system generates 4–6 manga panels with detailed image prompts. Each panel includes a scene description, narrative context, and suggested dialogue. Users can regenerate individual panels or all panels to explore different visual interpretations.

### Step 4: Dialogue Editing

Users review and customize dialogue for each panel. The interface provides real-time preview of how text appears within speech bubbles. Users can select from three speech bubble styles (round, square, jagged) and position them at the top, middle, or bottom of each panel. Dialogue is automatically wrapped to fit within the selected bubble style.

### Step 5: Preview & Export

The completed manga is displayed as a full-page preview. Users can select from four layout options (2×2 grid, 2×3 grid, 3×2 grid, or single-column vertical), download the manga as a JPEG file, save it to their gallery, save the current style as a template for future use, or share directly to X (Twitter).

## Technical Specifications

### Frontend Architecture

The frontend is built with modern React and TypeScript, providing a responsive and interactive user experience across all devices.

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | React 19 + TypeScript | Component-based UI with type safety |
| **Styling** | Tailwind CSS 4 | Utility-first CSS framework for responsive design |
| **UI Components** | shadcn/ui | Pre-built, accessible component library |
| **Routing** | Wouter | Lightweight client-side router |
| **State Management** | TanStack Query | Efficient server state and caching |
| **API Communication** | tRPC | End-to-end type-safe RPC framework |
| **Internationalization** | Custom i18n Context | Multi-language support (English, Japanese) |

### Backend Architecture

The backend provides a robust, scalable API layer with comprehensive business logic for AI integration and data persistence.

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Node.js 22 + Express 4 | High-performance JavaScript runtime and HTTP server |
| **API Framework** | tRPC 11 | Type-safe remote procedure calls with automatic client generation |
| **Database** | MySQL/TiDB + Drizzle ORM | Relational database with schema-first migrations |
| **Authentication** | Manus OAuth | Secure, federated identity management |
| **File Storage** | S3-Compatible Object Storage | Scalable cloud storage for generated images and user assets |
| **Image Processing** | Sharp | High-performance image resizing, composition, and format conversion |

### AI & Machine Learning Integration

The application integrates multiple AI services to power its core functionality:

| Service | Provider | Use Case |
|---------|----------|----------|
| **Large Language Model** | Manus LLM API | Story generation, panel prompt creation, dialogue refinement |
| **Image Generation** | DALL-E 3 | High-quality manga-style illustration generation |
| **Image Composition** | Sharp (Node.js) | JPEG assembly, panel layout, speech bubble rendering |

### Key Technical Features

- **End-to-End Type Safety**: tRPC ensures type consistency from backend procedures to frontend hooks, eliminating runtime type errors
- **Optimistic UI Updates**: Immediate visual feedback for user actions without waiting for server responses
- **Sequential Image Generation**: Each panel references the previous panel's image to maintain visual and stylistic consistency
- **SVG-Based Speech Bubbles**: Dynamically generated SVG speech bubbles with support for Japanese text wrapping and multiple shape styles
- **Responsive Image Handling**: Automatic image resizing, format conversion, and optimization for web delivery
- **Session Persistence**: Secure cookie-based session management with automatic token refresh

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React 19)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Home Page  │  │ Studio Page  │  │Gallery Page  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│         │                 │                  │                  │
│         └─────────────────┼──────────────────┘                  │
│                           │                                     │
│                    tRPC Client Layer                            │
└─────────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │                │
        ┌───────────▼────────┐  ┌────▼─────────────┐
        │  Express + tRPC    │  │  Authentication  │
        │   API Server       │  │   (Manus OAuth)  │
        └───────────┬────────┘  └──────────────────┘
                    │
        ┌───────────┴──────────────┬──────────────┐
        │                          │              │
   ┌────▼─────────┐    ┌──────────▼─────┐   ┌─────▼─────────┐
   │  AI Router   │    │ Manga Router   │   │ Storage Layer │
   │              │    │                │   │               │
   │ • News       │    │ • CRUD Ops     │   │ • S3 Storage  │
   │ • Stories    │    │ • JPEG Gen     │   │ • Image Cache │
   │ • Panels     │    │ • Gallery      │   │               │
   │ • Images     │    │ • X Sharing    │   │               │
   └────┬─────────┘    └────────────────┘   └───────────────┘
        │
    ┌───┴─────────────────┬──────────────┐
    │                     │              │
┌───▼──────────┐  ┌───────▼───┐  ┌───────▼────────┐
│ Manus LLM    │  │ DALL-E 3  │  │ News Sources   │
│ API          │  │           │  │                │
└──────────────┘  └───────────┘  └────────────────┘
    │
┌───▼──────────────────────────────────────┐
│  Database Layer (MySQL/TiDB)             │
│  ┌──────────────────────────────────┐    │
│  │ • Users                          │    │
│  │ • Manga Projects                 │    │
│  │ • Manga Panels                   │    │
│  │ • Completed Manga                │    │
│  │ • Templates                      │    │
│  └──────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

## Database Schema

The application uses a relational database with four primary tables:

### Users Table
Stores user account information and authentication credentials.

```
users
├── id (Primary Key)
├── openId (Unique)
├── name
├── email
├── loginMethod
├── role (admin | user)
├── xAccessToken (for X sharing)
├── xRefreshToken
├── createdAt
├── updatedAt
└── lastSignedIn
```

### Manga Projects Table
Represents in-progress manga creation projects.

```
manga_projects
├── id (Primary Key)
├── userId (Foreign Key → users)
├── projectTitle
├── sourceNewsUrl
├── newsContent
├── plotDescription
├── status (draft | in_progress | completed)
├── mainCharacter (JSON: appearance description)
├── supportingCharacter (JSON: appearance description)
├── artStyle (JSON: style preferences)
├── createdAt
└── updatedAt
```

### Manga Panels Table
Stores individual panel data for each project.

```
manga_panels
├── id (Primary Key)
├── projectId (Foreign Key → manga_projects)
├── panelNumber
├── imagePrompt
├── generatedImageUrl
├── dialogueText
├── dialoguePosition (top | middle | bottom)
├── bubbleShape (round | square | jagged)
├── finalImageUrl
├── createdAt
└── updatedAt
```

### Completed Manga Table
Archives finished manga with sharing metadata.

```
completed_manga
├── id (Primary Key)
├── projectId (Foreign Key → manga_projects)
├── userId (Foreign Key → users)
├── title
├── sourceNewsUrl
├── finalImageUrl
├── layoutType (2x2 | 2x3 | 3x2 | 1-column)
├── xPostId (if shared to X)
├── xSharedAt
├── createdAt
└── updatedAt
```

### Templates Table
Stores reusable manga style templates.

```
manga_templates
├── id (Primary Key)
├── userId (Foreign Key → users)
├── templateName
├── description
├── mainCharacter (JSON)
├── supportingCharacter (JSON)
├── artStyle (JSON)
├── bubbleShape (round | square | jagged)
├── layoutType (2x2 | 2x3 | 3x2 | 1-column)
├── isPublic (boolean)
├── usageCount
├── createdAt
└── updatedAt
```

## API Endpoints

### AI Router (`/api/trpc/ai.*`)

Handles all AI-related operations including news fetching, story generation, and image creation.

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|-----------|
| `fetchLatestNews` | Query | Retrieves 5 latest news articles | None |
| `extractNews` | Mutation | Extracts content from a news URL | `url: string` |
| `generateStoryProposals` | Mutation | Generates 3 story proposals | `newsContent: string` |
| `generatePanelPrompts` | Mutation | Creates panel prompts for a story | `storyDescription: string`, `panelCount: number` |
| `generateImage` | Mutation | Generates a manga panel image | `prompt: string`, `previousImageUrl?: string` |
| `getImageAsBase64` | Query | Converts image URL to Base64 | `imageUrl: string` |

### Manga Router (`/api/trpc/manga.*`)

Manages manga project CRUD operations, gallery, and export functionality.

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|-----------|
| `createProject` | Mutation | Creates a new manga project | `projectData: object` |
| `getProject` | Query | Retrieves project details | `projectId: number` |
| `updateProject` | Mutation | Updates project information | `projectId: number`, `updates: object` |
| `createPanel` | Mutation | Adds a panel to a project | `projectId: number`, `panelData: object` |
| `getProjectPanels` | Query | Lists all panels for a project | `projectId: number` |
| `updatePanel` | Mutation | Modifies panel content | `panelId: number`, `updates: object` |
| `completeManga` | Mutation | Marks project as complete | `projectId: number` |
| `getGallery` | Query | Retrieves user's completed manga | `userId: number` |
| `generateJPEG` | Mutation | Composes panels into JPEG | `projectId: number`, `layoutType: string` |
| `shareToX` | Mutation | Records X sharing metadata | `mangaId: number`, `postId: string` |
| `getTemplates` | Query | Lists available templates | `includePublic?: boolean` |
| `saveAsTemplate` | Mutation | Saves current project as template | `projectId: number`, `templateName: string` |

## Environment Variables

The following environment variables are automatically configured by the Manus Platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Secret key for session signing | (auto-generated) |
| `VITE_APP_ID` | Manus OAuth application ID | (auto-generated) |
| `OAUTH_SERVER_URL` | Manus OAuth backend endpoint | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | Manus login portal URL | `https://oauth.manus.im` |
| `BUILT_IN_FORGE_API_URL` | Manus built-in APIs endpoint | `https://forge.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Bearer token for Manus APIs | (auto-generated) |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend-safe API key | (auto-generated) |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend-accessible API endpoint | `https://forge.manus.im` |

## Development

### Prerequisites

- Node.js 22 or later
- pnpm 10 or later
- Manus Platform account with project setup

### Setup

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

The development server will be available at `http://localhost:3000`.

### Testing

The project includes comprehensive unit tests for backend services and utilities:

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test server/bubble-shapes.test.ts

# Run tests in watch mode
pnpm test --watch
```

### Building for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

### Code Structure

```
ai-manga-creator/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components (Home, Studio, Gallery)
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Language, Auth)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities (tRPC client, helpers)
│   │   ├── i18n/             # Translation files (en.json, ja.json)
│   │   ├── App.tsx           # Main app component with routing
│   │   └── main.tsx          # Entry point
│   └── public/               # Static assets
├── server/                    # Express backend
│   ├── routers.ts            # tRPC procedure definitions
│   ├── db.ts                 # Database query helpers
│   ├── ai-router.ts          # AI-related endpoints
│   ├── manga-router.ts       # Manga CRUD endpoints
│   ├── jpeg-generator.ts     # JPEG composition logic
│   ├── bubble-shapes.ts      # Speech bubble SVG generation
│   └── _core/                # Framework internals
├── drizzle/                   # Database schema and migrations
│   └── schema.ts             # Drizzle ORM schema definitions
├── shared/                    # Shared types and constants
│   └── schema.ts             # Shared TypeScript types
└── storage/                   # S3 storage helpers
    └── index.ts              # File upload utilities
```

## Performance Considerations

- **Image Caching**: Generated images are cached in S3 to reduce redundant API calls
- **Lazy Loading**: Frontend components are code-split for faster initial page load
- **Database Indexing**: Frequently queried fields are indexed for optimal query performance
- **Sequential Image Generation**: Panels are generated one at a time to maintain consistency and manage API rate limits
- **JPEG Compression**: Output images use 90% quality JPEG compression to balance file size and visual quality

## Security Features

- **OAuth 2.0 Authentication**: Secure user authentication via Manus OAuth
- **Session Management**: Secure, httpOnly cookies with automatic token refresh
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **CORS Protection**: Configured CORS headers for cross-origin requests
- **Rate Limiting**: API endpoints include rate limiting to prevent abuse
- **Environment Variable Protection**: Sensitive credentials stored in environment variables, never in code

## Deployment

The application is deployed on the Manus Platform, which provides:

- Automatic SSL/TLS certificates
- Global CDN for static assets
- Managed MySQL/TiDB database
- S3-compatible object storage
- Automatic scaling and load balancing
- Built-in monitoring and logging

To deploy updates:

1. Create a checkpoint in the Manus Management UI
2. Click the "Publish" button to deploy the latest checkpoint
3. The application will be available at your configured domain

## Troubleshooting

### Images not generating
- Verify DALL-E 3 API access is enabled in Manus Platform settings
- Check that the image prompt is not too long or contains invalid characters
- Review server logs for API error details

### Database connection errors
- Verify `DATABASE_URL` environment variable is correctly configured
- Ensure database migrations have been run with `pnpm db:push`
- Check network connectivity to the database host

### Speech bubbles not rendering correctly
- Ensure Noto Sans CJK JP font is available in the server environment
- Verify Japanese text is properly encoded in UTF-8
- Check JPEG generation logs for SVG rendering errors

## Future Enhancements

Potential features for future development include:

- **Video Export**: Generate animated manga sequences as MP4 videos
- **Advanced Styling**: Custom color schemes and visual effects
- **Batch Processing**: Create multiple manga from a single news article
- **AI Voice**: Add text-to-speech for dialogue narration
- **Collaborative Editing**: Real-time collaboration with other users
- **Mobile App**: Native iOS and Android applications
- **Print-Ready Export**: High-resolution PDF output for physical printing

## License

MIT License

## Credits

- **Development**: Manus AI
- **Platform**: Manus Platform
- **AI Services**: OpenAI (DALL-E 3), Manus LLM API
- **UI Framework**: React, Tailwind CSS, shadcn/ui
- **Backend**: Express, tRPC, Drizzle ORM

## Support

For issues, feature requests, or questions, please visit the [Manus Help Center](https://help.manus.im) or contact support through the Manus Platform dashboard.

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Status**: Production Ready
