const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../models/User.schema');
const router = Router();

router.post(
	'/register',
	[
		check('email', 'Incorrect Email').isEmail(),
		check('password', 'Min password length is 6 characters').isLength({ min: 6 })
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					errors: errors.array(),
					message: 'Incorrect data during registration'
				});
			}

			const { email, password, name } = req.body;

			const candidate = await User.findOne({ email });

			if (candidate) {
				return res.status(400).json({ message: 'Sorry, but this user already exists' });
			}

			const hashedPassword = await bcrypt.hash(password, 12);

			const user = new User({ email, password: hashedPassword, name });

			await user.save();
			res.status(201).json({ message: "That's all right. User created" });
		} catch (e) {
			console.log('auth', e);
			res.status(500).json({ message: 'something wrong' });
		}
	}
);

router.post(
	'/login',
	[
		check('email', 'Please, enter the correct email address').normalizeEmail().isEmail(),
		check('password', 'Enter your password').exists()
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				return res.status(400).json({
					errors: errors.array(),
					message: 'Invalid login information'
				});
			}

			const { email, password } = req.body;

			const user = await User.findOne({ email });

			if (!user) {
				return res.status(400).json({ message: 'User not found' });
			}

			const isMatch = await bcrypt.compare(password, user.password);

			if (!isMatch) {
				return res.status(400).json({ message: 'Wrong password, please try again' });
			}

			const token = jwt.sign({ userId: user.id }, config.get('jwtSecret'), { expiresIn: '2h' });

			const avatarURL = user.avatarURL || "http://res.cloudinary.com/nazdac/image/upload/v1616652013/travelAppFolder/dmlfcuvyr79gpkbgg639.jpg"

			res.json({ token, userId: user.id, name: user.name, avatarURL });
		} catch (e) {
			console.log('login', e);
			res.status(500).json({ message: 'something wrong' });
		}
	}
);

module.exports = router;
