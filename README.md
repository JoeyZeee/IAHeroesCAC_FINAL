# IAHeroes - Iowa Veterans Story Archive

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC.svg)](https://tailwindcss.com/)

## 2025 Congressional App Challenge Winner!
**Iowa's 3rd Congressional District**

IAHeroes was selected as the winner of the 2025 Congressional App Challenge for Iowa's 3rd Congressional District. The Congressional App Challenge is a nationwide competition sponsored by Members of the U.S. House of Representatives that encourages students to create apps that solve real-world problems. 

## Overview

IAHeroes is a comprehensive web platform dedicated to preserving and sharing the stories of Iowa's veterans. The application serves as a digital archive where veterans, their families, and community members can submit, explore, and interact with veteran stories, creating a lasting legacy for future generations.

## Mission

To honor and preserve the incredible stories of Iowa's veterans by providing a modern, accessible platform for storytelling, education, and community connection. IAHeroes bridges the gap between generations, ensuring that the sacrifices and experiences of our veterans are never forgotten.

## Features

### Home Page
- **Hero Section**: Welcoming interface with mission statement and call-to-action buttons
- **Statistics Dashboard**: Real-time display of stories, veterans, and thank-you letters
- **Quick Actions**: Direct access to Veteran, Educator, and Moderator portals
- **Featured Stories**: Randomly selected stories showcased on the homepage

### Story Archive
- **Advanced Search**: Filter stories by name, branch, conflict, or location
- **Interactive Cards**: Rich story previews with photos, metadata, and engagement metrics
- **Bookmarking System**: Save favorite stories for later reading
- **View Counts**: Track story popularity and engagement
- **Flagging System**: Community moderation for inappropriate content

### Timeline View
- **Chronological Display**: Interactive timeline spanning from 1800 to present
- **Visual Story Markers**: Star-shaped indicators for each story
- **Hover Effects**: Enhanced user experience with story previews
- **Year Range Visualization**: Clear historical context

### User Portals

#### Veteran Portal
- Access personal stories and submissions
- Connect with other veterans
- View letters sent by other veterans and students

#### Educator Portal
- Access educational resources
- Request virtual veteran visits
- Integrate stories into curriculum

#### Moderator Portal
- Review story submissions
- Manage flagged content
- Maintain platform quality

### Story Submission
- **Multi-media Support**: Photos for upload during story submission
- **Cloud Storage**: Secure file uploads
- Comprehensive story formatting

### Thank You Letters
- **Letter Writing Interface**: Easy-to-use form for expressing gratitude
- **Email Integration**: Direct delivery to veterans 

### Authentication & Security
- **Firebase Authentication**: Secure user management
- **Role-based Access**: Different permissions for different user types
- **Data Protection**: Privacy controls and content moderation

## Tech Stack

### Frontend
- **React 18.2.0**: Modern UI framework with hooks
- **React Router DOM 6.8.1**: Client-side routing
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Vite 7.0.0**: Fast build tool and development server

### Backend & Database
- **Firebase 10.7.1**: Backend-as-a-Service
  - **Firestore**: NoSQL cloud database
  - **Firebase Auth**: User authentication
  - **Firebase Storage**: File storage

### External Services
- **Cloudinary 1.41.0**: Cloud media management
- **EmailJS 4.4.1**: Email service integration

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase project setup
- Cloudinary account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoeyZeee/IAHeroesCAC_FINAL.git
   cd IAHeroesCAC_FINAL
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables to run locally**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   # Cloudinary Configuration
   VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
   # EmailJS Configuration
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   # Contact Email
   VITE_CONTACT_EMAIL=your_contact_email
   ```

4. **Start the development server**
   ```bash
   cd ../frontend
   npm run dev
   ```

The application will be available at `http://localhost:51xx`

## Project Structure

```
IAHeroesCAC_FINAL/
├── frontend/
│   ├── public/                     # Static assets served at root
│   ├── src/
│   │   ├── components/             # Reusable React components (Navbar, etc.)
│   │   ├── App.jsx                 # Root component and route definitions
│   │   ├── StyledLanding.jsx       # Home page
│   │   ├── StoryDetail.jsx         # Individual story view
│   │   ├── SubmitStory.jsx         # Story submission form
│   │   ├── ThankYouLetter.jsx      # Thank you letter form
│   │   ├── Veteran.jsx             # Veteran portal
│   │   ├── Educator.jsx            # Educator portal
│   │   ├── Moderator.jsx           # Moderator portal
│   │   ├── firebase.js             # Firebase initialization and config
│   │   └── main.jsx                # App entry point
│   ├── .env.example                # Environment variable template
│   ├── vercel.json                 # Vercel SPA rewrite rules
│   └── package.json
├── delete_non_legit_stories.py     # Admin script: prune invalid stories
├── delete_orphaned_bookmarks.py    # Admin script: prune orphaned bookmarks
└── README.md
```

## Key Components

### Authentication System
- **AuthForm**: Login/signup interface
- **Role-based Routing**: Different experiences for different user types

### Story Management
- **SubmitStory**: Story submission form with media upload 
- **StoryDetail**: Individual story view with comments and reactions
- **Archive**: Browseable story collection with advanced search 

### User Interfaces
- **Veteran**: Veteran-specific dashboard and tools
- **Educator**: Educational resources and classroom integration
- **Moderator**: Content moderation and platform management

## Available Scripts

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Admin Scripts
 
These Python scripts use the Firebase Admin SDK and must be run locally with a service account key:
 
- **`delete_non_legit_stories.py`** - Removes stories that don't meet validity criteria
- **`delete_orphaned_bookmarks.py`** - Cleans up bookmarks pointing to deleted stories
- **`delete_illegitimate_accounts.py`** - Deletes all accounts that are not whitelisted

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
