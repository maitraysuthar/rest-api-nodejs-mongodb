const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

exports.isSuperAdmin = (user) => user?.role === 0;
exports.isAdmin = (user) => (user?.role === 1 || user?.role === 0);
exports.isViewer = (user) => user?.role === 2;

exports.generatePassword = (length = 8) => {
    let password = "";
    for (let i = 0; i < length; i++) {
        password += alpha.charAt(
            Math.floor(Math.random() * alpha.length)
        );
    }
    return password;
};