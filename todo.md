# AI Manga Creator - Project TODO

## Phase 1: Database Schema
- [x] Create manga_projects table
- [x] Create manga_panels table
- [x] Create completed_manga table
- [x] Add X API tokens to users table
- [x] Run database migration

## Phase 2: Backend API Implementation
- [x] Implement AI agent for news fetching
- [x] Implement story generation API
- [x] Implement panel prompts generation API
- [x] Implement image generation API with consistency
- [x] Implement JPEG composition API
- [x] Implement manga CRUD operations
- [x] Implement gallery endpoints
- [x] Implement X sharing functionality

## Phase 3: Frontend UI Implementation
- [x] Create Home page with hero section
- [x] Create Studio page with step workflow
- [x] Implement news selection step (5 articles)
- [x] Implement story generation step (3 proposals)
- [x] Implement panel creation step (4-6 panels)
- [x] Implement dialogue editing step
- [x] Implement preview and download step
- [x] Create Gallery page
- [x] Add X sharing UI

## Phase 4: Testing and Deployment
- [x] Test full workflow
- [x] Verify image generation
- [x] Test download functionality
- [x] Test X sharing
- [x] Create checkpoint

## Phase 5: Documentation
- [x] Create README.md with overview
- [x] Add promotional image
- [x] Document features
- [x] Document architecture
- [x] Create architecture diagram

## Phase 6: Fix Deploy Issue
- [x] Remove canvas package (native dependency)
- [x] Implement alternative JPEG generation using sharp or browser-based approach
- [x] Update tests
- [x] Create new checkpoint

## Phase 7: SEO Improvements
- [x] Add proper page title (30-60 characters)
- [x] Add meta description (50-160 characters)
- [x] Add meta keywords
- [x] Create new checkpoint

## Phase 8: OGP Image Setup
- [x] Generate OGP image (1200x630px)
- [x] Add image to public folder
- [x] Add OGP meta tags to index.html
- [x] Create new checkpoint

## Phase 9: Image Consistency Improvement
- [x] Review current image generation logic
- [x] Change to sequential generation (each panel references previous)
- [x] Update generatePanelImages API to generate one by one
- [x] Test consistency across multiple panels
- [x] Create new checkpoint

## Phase 10: Home Page UI Cleanup
- [x] Remove unnecessary panel images from home page hero section
- [x] Create new checkpoint

## Phase 11: JPEG Generation & UI Improvements
- [x] Fix Japanese font rendering in JPEG generation
- [x] Improve art style to anime/fantasy/beautiful/cute style
- [x] Add close button for JPEG preview modal
- [x] Test JPEG generation with Japanese text
- [x] Create new checkpoint

## Phase 12: Speech Bubble Customization & Layout Options
- [x] Add speech bubble shape options (round, square, jagged)
- [x] Add speech bubble position options (top, middle, bottom)
- [x] Update database schema to store bubble preferences
- [x] Update JPEG generator to render different bubble shapes
- [x] Add layout selection UI (2x2, 2x3, 1-column)vertical)
- [x] Update JPEG generator to support different layouts
- [x] Test all combinations
- [x] Create new checkpoint

## Phase 13: Template Gallery Feature & News Update
- [x] Add manga_templates table to database schema
- [x] Create template CRUD operations in db.ts
- [x] Add template API endpoints in routers.ts
- [x] Create Templates page UI
- [x] Add "Save as Template" button in preview step
- [x] Add "Use Template" option in story step
- [x] Verify JPEG generation works correctly
- [x] Verify X posting functionality
- [x] Create new checkpoint
- [x] Update news fetching to get latest news (not old cached news)

## Phase 14: Character Settings & Internationalization
### Character Settings Feature
- [x] Add character settings to database schema (manga_projects table)
- [x] Create character settings UI in story step
- [x] Update story generation to include character descriptions
- [x] Update panel image generation to use character settings
- [x] Ensure character consistency across all panels

### Internationalization (i18n)
- [x] Create language context and provider
- [x] Create translation files (en.json, ja.json)
- [x] Add language switcher to header
- [x] Translate all UI text in Home page
- [x] Translate all UI text in Studio page
- [x] Translate all UI text in Gallery page
- [x] Translate all UI text in Templates page
- [x] Create new checkpoint

## Phase 15: Image Consistency Improvement
- [x] Review current image generation logic in ai-agent.ts
- [x] Ensure previous panel image URL is passed to generateImage API
- [x] Update generatePanelImage to use originalImages parameter for reference
- [x] Update frontend handleGenerateAllImages to pass previous image URLs
- [x] Test sequential image generation for consistency
- [x] Create new checkpoint

## Phase 16: JPEG Preview and Speech Bubble Fix
- [x] Add back/done buttons to JPEG preview modal
- [x] Fix speech bubble to use decorated rectangular box instead of ellipse
- [x] Fix Japanese text rendering in speech bubbles
- [x] Test JPEG generation with new speech bubble style
- [ ] Create new checkpoint

## Phase 17: English README Documentation
- [x] Create comprehensive English README.md
- [x] Include app overview and key features
- [x] Add OGP promotional image
- [x] Document technical specifications (frontend, backend, AI integration)
- [x] Include architecture diagram
- [x] Document database schema with all tables
- [x] List all API endpoints with descriptions
- [x] Add development setup and testing instructions
- [x] Include deployment and troubleshooting guides
- [x] Create checkpoint
