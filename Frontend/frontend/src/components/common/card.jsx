const Card = ({ children, title, icon: Icon, action, className = '' }) => (
  <div className={`bg-black/60 border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center bg-black p-2 rounded-lg gap-2">
        {Icon && <Icon className="text-emerald-400 shrink-0" size={16} />}
        <h3 className="font-semibold text-slate-50 text-sm">{title}</h3>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
    {children}
  </div>
);

export default Card;
