var express = require("express");
const UserController = require("../controllers/UserController");

var router = express.Router();

router.get("/", UserController.userList);
// router.get("/:id", UserController.bookDetail);
// router.post("/", UserController.bookStore);
router.put("/:id", UserController.userUpdate);
router.delete("/:id", UserController.userDelete);

module.exports = router;