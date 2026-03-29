# 💾 Disk Space Analyzer

A local disk space analyzer application that helps you visualize and manage disk usage on your computer.

## Features

✨ **Core Features:**
- 📊 **Dashboard**: Real-time disk space visualization with pie and bar charts
- 📁 **File Browser**: Browse folders and files with size and modification dates
- 🔍 **Duplicate Finder**: Detect duplicate files and see potential space savings
- ⚙️ **Settings**: Configure exclusion folders and customize the application
- 🌙 **Dark Mode**: Built-in dark mode support for comfortable viewing
- 🚫 **Folder Exclusions**: Skip system folders and large directories during scans

## Technology Stack

**Backend:**
- Python 3.8+
- FastAPI - Fast, modern web framework
- SQLite - Lightweight database for caching results
- Uvicorn - ASGI server

**Frontend:**
- React 18
- Recharts - Data visualization library
- Axios - HTTP client
- CSS3 - Modern styling with dark mode support

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start the Backend Server

```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

### Start the Frontend

In a new terminal:

```bash
cd frontend
npm start
```

The application will open at `http://localhost:3000`

## Project Structure

```
computerscanfiles/
├── backend/
│   ├── main.py                 # FastAPI entry point
│   ├── requirements.txt         # Python dependencies
│   └── app/
│       ├── api/               # API endpoints
│       ├── services/          # Business logic
│       ├── models/            # Data models
│       └── config.py          # Configuration
├── frontend/
│   ├── package.json           # Node dependencies
│   ├── public/                # Static files
│   └── src/
│       ├── components/        # React components
│       ├── hooks/             # Custom hooks
│       ├── styles/            # CSS files
│       └── utils/             # Utility functions
└── README.md
```

## API Endpoints

### Scan Operations
- `GET /api/scan/start?path=/` - Start scanning a disk or folder
- `GET /api/scan/stats?path=/` - Get disk space statistics

### File Operations
- `GET /api/files/folder?path=/folder` - Get folder contents
- `DELETE /api/files/delete?path=/file` - Delete a file or folder
- `GET /api/files/size?path=/file` - Get file/folder size
- `GET /api/files/exclusions` - Get excluded folders
- `POST /api/files/exclusions/add?folder_path=` - Add to exclusions
- `POST /api/files/exclusions/remove?folder_path=` - Remove from exclusions

### Duplicate Detection
- `GET /api/duplicates/find?folder_path=` - Find duplicate files
- `GET /api/duplicates/summary?folder_path=` - Get duplicates summary

## Features in Detail

### Dashboard
- View total, used, and free disk space
- Visual pie chart showing disk usage
- Bar chart comparing used vs. free space
- Real-time statistics

### File Browser
- Navigate through folder hierarchy with breadcrumb navigation
- View file/folder names, sizes, and modification dates
- Delete files and folders with confirmation
- Search and filter by filename or type

### Duplicate Finder
- Hash-based duplicate detection (SHA256)
- Show all duplicate file sets
- Display potential space savings
- Identify which files can be safely deleted

### Settings
- Add/remove folders from exclusion list
- Configure scanning preferences
- View application information

## Dark Mode

The application supports dark mode with:
- Automatic theme detection from system preferences
- Toggle button in the header
- Persistent preference using localStorage

## Performance Considerations

- **Database Caching**: Scan results are cached in SQLite for quick access
- **Async Operations**: Backend uses async/await for non-blocking file operations
- **Throttling**: UI updates are throttled to prevent performance issues
- **Large File Support**: Efficiently handles files and directories up to TB size

## Known Limitations

- Initial full disk scan may take time for large drives
- Network drives may have slower performance
- Some system folders may not be accessible due to permissions

## Troubleshooting

### Backend Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check CORS configuration if frontend can't reach backend
- Verify firewall settings

### Slow Scans
- Exclude large temporary folders
- Scan specific folders instead of entire drives
- Reduce the number of items being displayed

### Permission Errors
- Run with appropriate privileges
- Check folder permissions
- Add inaccessible folders to exclusion list

## Future Enhancements

- [ ] Real-time disk monitoring
- [ ] Export scan reports (PDF, CSV)
- [ ] Scheduled scans
- [ ] File type categorization
- [ ] Multi-threaded scanning
- [ ] Cloud storage integration
- [ ] Compression suggestions

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - See LICENSE file for details

## Author

Created with ❤️ for disk space management
