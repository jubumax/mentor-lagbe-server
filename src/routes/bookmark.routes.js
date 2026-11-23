import { Router } from "express";
import {
    addBookmark,
    getBookmarkIds,
    getBookmarks,
    removeBookmark,
} from "../controllers/bookmark.controller.js";
import { verifyStudent } from "../middlewares/verifyRole.js";

const router = Router();

router.get("/", verifyStudent, getBookmarks);
router.get("/ids", verifyStudent, getBookmarkIds);
router.post("/:tuitionId", verifyStudent, addBookmark);
router.delete("/:tuitionId", verifyStudent, removeBookmark);

export default router;