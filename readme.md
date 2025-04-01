

# ![MDHub Logo](https://fyqddomrlpkowgosopyt.supabase.co/storage/v1/object/public/test//graph_6_24dp_F85149_FILL0_wght400_GRAD0_opsz24.png ) MDHub - Markdown File Sharing Platform


MDHub is a web-based platform for creating, sharing, and discovering markdown files. It provides a clean, intuitive interface for writing markdown content and sharing it with others.

## Features

### Core Functionality
- **Create & Edit Markdown Files**: Rich markdown editor with toolbar for common formatting options
- **Preview Rendering**: Real-time preview of markdown content
- **File Sharing**: Public and unlisted sharing options
- **File Discovery**: Browse trending and recently added files
- **User Authentication**: Anonymous login for quick access
- **Dark/Light Mode**: Toggle between dark and light themes

### Collaboration & Engagement
- **Comments**: Discuss markdown files with other users
- **Like & Star**: Show appreciation for quality content
- **Tagging System**: Categorize and discover content by tags
- **Search**: Find markdown files by title, content, or tags

### File Management
- **View Count**: Track popularity of shared files
- **Download**: Export markdown files
- **Embedding**: Embed shared markdown in other websites

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection

### Installation
1. Clone the repository:
   ```
   git clone https://github.com/abdelhakim-sahifa/MdHub---Open-source.git
   ```
2. Open `index.html` in your browser or deploy to a web server

### Usage

#### Creating a New File
1. Click the "New File" button on the home page
2. Enter a title for your markdown file
3. Write or paste your markdown content in the editor
4. Add tags (comma separated)
5. Choose visibility (public or unlisted)
6. Click "Share File" to publish

#### Viewing Files
- Browse trending files on the home page
- Use the search bar to find specific content
- Click on tags to see related files
- Visit "My Files" to see your published content

#### Editing Files
- You can only edit files you've created
- Navigate to the file and click the "Edit" button
- Make your changes and save

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript
- **Storage**: Firebase Realtime Database, Supabase
- **Authentication**: Firebase Authentication
- **Markdown Processing**: Marked.js

## Project Structure

```
MDHub/
├── 404.html                # Error page
├── about.html              # About page
├── create-file.html        # Create new markdown file
├── edit-file.html          # Edit existing file
├── embed.html              # Embed markdown file
├── explore.html            # Explore page
├── feedback.html           # Feedback page
├── index.html              # Home page
├── my-files.html           # User's files
├── preview-file.html       # File preview page
├── privacy.html            # Privacy policy
├── profile.html            # User profile page
├── search.html             # Search results
├── starred.html            # Starred files page
├── terms.html              # Terms of service
├── theme.html              # Theme settings
├── view-file.html          # View shared file
├── css/
│   ├── about.css
│   ├── admin-feedback.css
│   ├── admin.css
│   ├── base.css            # Base styles
│   ├── components.css      # UI component styles
│   ├── components-animated.css
│   ├── editor.css          # Editor styles
│   ├── explore.css
│   ├── feedback.css
│   ├── markdown.css        # Markdown rendering styles
│   ├── my-files.css
│   ├── preview-file.css
│   ├── search.css
│   ├── starred.css
│   ├── terms-and-policy.css
│   ├── viewer.css          # File viewer styles
│   ├── watch-ads.css
├── js/
│   ├── auth.js             # Authentication logic
│   ├── config.js           # Firebase/Supabase configuration
│   ├── editor.js           # Markdown editor functionality
│   ├── explore.js          # Explore page functionality
│   ├── feedback.js         # Feedback handling
│   ├── home.js             # Home page functionality
│   ├── my-files.js         # User's files management
│   ├── preview-file.js     # File preview logic
│   ├── profile.js          # User profile handling
│   ├── search.js           # Search functionality
│   ├── starred.js          # Starred files logic
│   ├── theme.js            # Theme switching logic
│   ├── viewer.js           # File viewing functionality
└── README.md               # Project documentation
```



## Firebase Security Rules

```json
{
  "rules": {
    ".read": true,  // Allow public read access to the entire database
      
    "users": {
      "$userId": {
        ".read": "auth != null && auth.uid === $userId",
        ".write": "auth != null && auth.uid === $userId"
      }
    },
    
    "feedback": {
      ".write": true,
      "$feedbackId": {
        ".validate": "newData.hasChildren(['type', 'message', 'timestamp']) && 
                     newData.child('type').isString() && 
                     newData.child('message').isString() && 
                     newData.child('timestamp').isNumber()"
      }
    },
    
    "mdfiles": {
      ".read": true,
      "$fileId": {
        ".write": "(!data.exists() && auth != null) || 
                  (data.exists() && auth != null && data.child('userId').val() === auth.uid)",
        ".validate": "newData.hasChildren(['id', 'title', 'content', 'timestamp', 'userId']) && 
                      newData.child('id').isString() && 
                      newData.child('title').isString() && 
                      newData.child('content').isString()",
        
        "views": {
          ".write": true
        },
        "likes": {
          ".write": "auth != null"
        },
        "stars": {
          ".write": "auth != null"
        }
      }
    },
    
    "pending_mdfiles": {
      ".read": "auth != null",  
      "$fileId": {
        ".write": "(!data.exists() && auth != null) || 
                  (data.exists() && auth != null && data.child('userId').val() === auth.uid)",
        ".validate": "newData.hasChildren(['id', 'title', 'content', 'timestamp', 'userId', 'status']) && 
                      newData.child('id').isString() && 
                      newData.child('title').isString() && 
                      newData.child('content').isString() &&
                      newData.child('status').isString()"
      }
    },
    
    "rejected_mdfiles": {
      ".read": "auth != null",  
      "$fileId": {
        ".write": "auth != null && newData.child('userId').val() === auth.uid",
        ".validate": "newData.hasChild('id') && newData.hasChild('status')"
      }
    },
    
    "file_comments": {
      ".read": true,
      "$fileId": {
        "$commentId": {
          ".write": "((!data.exists() && auth != null && 
                     newData.hasChildren(['userId', 'content', 'timestamp']) &&
                     newData.child('userId').val() === auth.uid) || 
                    (data.exists() && auth != null && 
                     data.child('userId').val() === auth.uid && 
                     !newData.exists()))"
        }
      }
    },
    
    "user_likes": {
      "$userId": {
        ".read": "auth != null && auth.uid === $userId",
        ".write": "auth != null && auth.uid === $userId"
      }
    },
    
    "user_stars": {
      "$userId": {
        ".read": "auth != null && auth.uid === $userId",
        ".write": "auth != null && auth.uid === $userId"
      }
    }
  }
}
```

*Note: These are not the actual rules we use and may not be fully secure. If you are a contributor from the open-source community and see areas for improvement, please provide your suggestions.*

### Troubleshooting

If these rules do not work as expected, use the following test rules to allow full access during debugging:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Use these only for testing and remove them when deploying to production.



## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](License.md).

## Contact

abdelhakim.sahifa@yahoo.com

## Acknowledgements

- [Marked.js](https://marked.js.org/) for markdown parsing
- [Firebase](https://firebase.google.com/) for database and authentication
- [Supabase](https://supabase.io/) for storage
- [Material Icons](https://fonts.google.com/icons) for UI icons
