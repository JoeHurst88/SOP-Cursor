# SOP Generator

A professional Standard Operating Procedure (SOP) generator with advanced PDF export capabilities.

## Features

- 🔐 **User Authentication** - Secure login system
- 📝 **SOP Management** - Create, edit, delete SOPs  
- 🎨 **Professional PDF Export** - High-quality PDFs with proper formatting
- 👀 **Real-time Preview** - See exactly how your PDF will look
- 📱 **Responsive Design** - Works on desktop and mobile
- 🎯 **Advanced Layout** - Headers, footers, page breaks, signatures

## Tech Stack

### Frontend
- **React** - User interface framework
- **Tailwind CSS** - Styling and responsive design
- **React Router** - Navigation
- **React DatePicker** - Date selection components
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (in-memory for development)
- **Puppeteer** - PDF generation
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JoeHurst88/SOP-Cursor.git
   cd SOP-Cursor
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the Backend Server**
   ```bash
   cd ../backend
   PORT=5001 node server.js
   ```

5. **Start the Frontend Development Server**
   ```bash
   cd ../frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Default Login Credentials
- **Username:** admin
- **Password:** admin123

## Project Structure

```
SOP-Cursor/
├── backend/
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Authentication middleware  
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── package.json
│   └── server.js            # Main server file
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/             # API integration
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React context
│   │   ├── pages/           # Page components
│   │   └── App.js
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### SOPs
- `GET /api/sops` - Get all SOPs
- `GET /api/sops/:id` - Get specific SOP
- `POST /api/sops` - Create new SOP
- `PUT /api/sops/:id` - Update SOP
- `DELETE /api/sops/:id` - Delete SOP
- `GET /api/sops/:id/export` - Export SOP as PDF

## PDF Export Features

- ✅ Professional document layout
- ✅ Consistent headers and footers
- ✅ Proper page breaks
- ✅ Color preservation
- ✅ Signature blocks
- ✅ Metadata sections
- ✅ Step-by-step formatting

## Development

### Running in Development Mode

1. **Backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm start
   ```

### Building for Production

1. **Build Frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy Backend**:
   ```bash
   cd backend
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please create an issue on GitHub.

---

**Built with ❤️ for professional SOP management** 