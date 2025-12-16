import { clerkClient } from "@clerk/express";


const protect = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        const response = await clerkClient.users.getUser(userId)


        if(response.publicMetadata.role !== 'educator'){
            return res.status(403).json({ success: false, message: 'Access Denied. Educator Resource'});
        }

        next();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
}

export default protect;