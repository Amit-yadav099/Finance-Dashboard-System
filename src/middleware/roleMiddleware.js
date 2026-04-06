const allowRoles = (...roles) => {

  return (req, res, next) => {
  
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied: ${req.user.role} cannot perform this action` });
    }
    next();
  };
};

module.exports = { allowRoles };