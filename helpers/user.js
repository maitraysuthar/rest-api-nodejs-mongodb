exports.isSuperAdmin = (user) => user?.role === 0;
exports.isAdmin = (user) => user?.role === 1;
exports.isViewer = (user) => user?.role === 2;