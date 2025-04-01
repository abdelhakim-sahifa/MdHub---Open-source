

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
├── index.html              # Home page
├── create-file.html        # Create new markdown file
├── edit-file.html          # Edit existing file
├── view-file.html          # View shared file
├── search.html             # Search results
├── my-files.html           # User's files
├── css/
│   ├── base.css            # Base styles
│   ├── components.css      # UI component styles
│   ├── markdown.css        # Markdown rendering styles
│   ├── editor.css          # Editor styles
│   └── viewer.css          # File viewer styles
├── js/
│   ├── auth.js             # Authentication logic
│   ├── config.js           # Firebase/Supabase configuration
│   ├── editor.js           # Markdown editor functionality
│   ├── home.js             # Home page functionality
│   ├── theme.js            # Theme switching logic
│   └── viewer.js           # File viewing functionality
└── README.md               # Project documentation
```

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
