import { Webhook } from "svix";
import User from "../models/user.js";

export const clerkWebhooks = async (req, res) => {
    try {
        const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
        if (!webhookSecret) {
            console.error("CLERK_WEBHOOK_SECRET is not defined in environment variables.");
            return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
        }

        const wh = new Webhook(webhookSecret);

        let msg;
        const headers = req.headers;

        try {
            msg = wh.verify(JSON.stringify(req.body), {
                'svix-id': headers['svix-id'],
                'svix-timestamp': headers['svix-timestamp'],
                'svix-signature': headers['svix-signature'],
            });
        } catch (error) {
            console.error('Webhook verification error:', error);
            return res.status(400).json({ success: false, message: 'Webhook verification failed', error: error.message });
        }

        const { data, type } = msg;

        switch (type) {
            case 'user.created':
                {
                    const userData = {
                        _id: data.id,
                        email: data.email_addresses[0].email_address,
                        name: `${data.first_name} ${data.last_name}`,
                        image: data.image_url,
                        resume: ""
                    };
                    try {
                        await User.create(userData);
                        res.json({ success: true });
                        console.log('User created in MongoDB:', userData.name, userData.email);
                    } catch (error) {
                        console.error('Error creating user in MongoDB:', error);
                        return res.status(500).json({ success: false, message: 'Failed to create user in database', error: error.message });
                    }
                    break;
                }

            case 'user.updated':
                {
                    const userData = {
                        email: data.email_addresses[0].email_address,
                        name: `${data.first_name} ${data.last_name}`,
                        image: data.image_url,
                    };
                    try {
                        const updatedUser = await User.findByIdAndUpdate(data.id, userData);
                        if (updatedUser) {
                            res.json({ success: true });
                            console.log('User updated in MongoDB:', data.id);
                        } else {
                            console.log('User not found for update:', data.id);
                            res.status(404).json({ success: false, message: 'User not found for update' });
                        }
                    } catch (error) {
                        console.error('Error updating user in MongoDB:', error);
                        return res.status(500).json({ success: false, message: 'Failed to update user in database', error: error.message });
                    }
                    break;
                }

            case 'user.deleted':
                {
                    try {
                        const deletedUser = await User.findByIdAndDelete(data.id);
                        if (deletedUser) {
                            res.json({ success: true });
                            console.log('User deleted from MongoDB:', data.id);
                        } else {
                            console.log('User not found for deletion:', data.id);
                            res.status(404).json({ success: false, message: 'User not found for deletion' });
                        }
                    } catch (error) {
                        console.error('Error deleting user from MongoDB:', error);
                        return res.status(500).json({ success: false, message: 'Failed to delete user from database', error: error.message });
                    }
                    break;
                }

            default:
                res.json({ success: true, message: 'Unknown event type' });
                break;
        }

    } catch (error) {
        console.error('Webhook handler error:', error);
        res.status(500).json({ success: false, message: 'Webhook handler error', error: error.message });
    }
};