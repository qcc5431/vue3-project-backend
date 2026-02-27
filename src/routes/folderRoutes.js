const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");
const { verifyToken } = require("../middleware/auth");

// 所有文件夹路由都需要认证
router.get("/", verifyToken, folderController.getFolders);
router.post("/", verifyToken, folderController.createFolder);
router.put("/:id", verifyToken, folderController.updateFolder);
router.delete("/:id", verifyToken, folderController.deleteFolder);
router.post(
  "/:folderId/notes/:noteId",
  verifyToken,
  folderController.addNoteToFolder
);
router.delete(
  "/:folderId/notes/:noteId",
  verifyToken,
  folderController.removeNoteFromFolder
);
router.get("/:folderId/notes", verifyToken, folderController.getFolderNotes);

module.exports = router;
