const express = require('express');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
const multer = require('multer');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect('mongodb://localhost/quickmart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));

// Schemas
const partnerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    aadhaar: String,
    aadhaarFile: String,
    pan: String,
    panFile: String,
    vehicle: String,
    city: String,
    status: { type: String, default: 'pending' }
});

const orderSchema = new mongoose.Schema({
    cart: [{ item: String, price: Number, category: String }],
    address: String,
    payment: String,
    total: Number,
    status: { type: String, default: 'pending' },
    assignedPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', default: null }
});

const Partner = mongoose.model('Partner', partnerSchema);
const Order = mongoose.model('Order', orderSchema);

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinDeliveryPartners', () => {
        socket.join('deliveryPartners');
        console.log('Partner joined:', socket.id);
    });

    socket.on('acceptOrder', async ({ orderId, partnerId }) => {
        const order = await Order.findById(orderId);
        if (order && order.status === 'pending') {
            order.status = 'accepted';
            order.assignedPartner = partnerId;
            await order.save();
            io.to('deliveryPartners').emit('orderAssigned', { orderId, partnerId });
            socket.emit('orderAccepted', { orderId });
        }
    });

    socket.on('rejectOrder', ({ orderId }) => {
        console.log(`Order ${orderId} rejected by ${socket.id}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Routes
app.post('/api/enroll', upload.fields([{ name: 'aadhaar-file' }, { name: 'pan-file' }]), async (req, res) => {
    try {
        const { name, email, phone, aadhaar, pan, vehicle, city } = req.body;
        const aadhaarFile = req.files['aadhaar-file'][0].filename;
        const panFile = req.files['pan-file'][0].filename;

        const partner = new Partner({
            name, email, phone, aadhaar, aadhaarFile, pan, panFile, vehicle, city
        });
        await partner.save();
        res.json({ message: 'Enrollment successful', partner });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/partners', async (req, res) => {
    try {
        const partners = await Partner.find();
        res.json(partners);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { cart, address, payment, total } = req.body;
        const order = new Order({ cart, address, payment, total });
        await order.save();
        io.to('deliveryPartners').emit('newOrder', order);
        res.json({ message: 'Order placed', order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Serve delivery partner interface
app.get('/delivery-partner', (req, res) => {
    res.sendFile(path.join(__dirname, 'delivery-partner.html'));
});

// Start Server
const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));