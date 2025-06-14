
# 🌾 Farmer Connect

**Farmer Connect** is a full-stack web application that bridges the gap between **farmers** and **customers**. It provides a seamless marketplace for farmers to showcase their crops and manage stock, while enabling customers to browse, order, and track fresh farm produce in real time.

---
## ✨ Features

### 🧑‍🌾 Farmer Dashboard
- Add, edit, and update crop stock
- View and manage incoming orders
- Real-time notifications when a customer places an order
- Access to weather updates and farming tips

### 🛒 Customer Dashboard
- Browse marketplace and filter crops
- Add items to cart and place orders
- View order history and update profile
- Multiple payment modes (Cash on Delivery, UPI, Card)

### 🔐 Authentication
- Secure login and signup with Firebase Authentication
- Role-based redirection (Farmer or Customer)

### ☁️ Backend
- Firestore integration for real-time database
- Cloudinary for profile image uploads
- OpenWeatherMap API for live weather updates

---
## 🛠️ Tech Stack

| Frontend  | Backend / Cloud | APIs & Tools       |
|-----------|------------------|--------------------|
| HTML, CSS, JavaScript | Firebase Authentication | Firebase Firestore |
| Bootstrap (optional) | Firebase Functions (optional) | OpenWeatherMap API |
| Cloudinary (Image Uploads) | Firestore Rules & Indexing | Nodemailer (for OTP) |

---

## 📁 Folder Structure

```
Farmer Connect/
├── index.html
├── customer-dashboard.html
├── farmer4.html
├── mycrops.html
├── customer-cart.html
├── ...
├── config.js
├── firebase-config.js
├── README.md
└── firebase.json
```

---

## ⚙️ Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/farmer-connect.git
   cd farmer-connect
   ```

2. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a project, enable Authentication and Firestore
   - Copy Firebase config keys into `firebase-config.js`

3. **Enable APIs**
   - [OpenWeatherMap](https://openweathermap.org/api) – for weather data
   - [Cloudinary](https://cloudinary.com/) – for image uploads

4. **Run Locally**
   Open `index.html` in your browser or serve it using VS Code Live Server.

---

## 🧾 License

This project is proprietary and built for educational/hackathon purposes.  
Read the full [LICENSE](License.html) for more details.

---

## 🙋‍♂️ Contact

**Developed by:** Mangadudla Pavan  
📫 Email: mangadudlapavan@gmail.com 
🌐 LinkedIn: [https://www.linkedin.com/in/pavan-mangadudla-91ab01288/](https://linkedin.com/in/pavanyadav0106)
