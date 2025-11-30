const Card = ({ children, className = '', hover = false, onClick }) => {
    const hoverEffect = hover ? 'hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer' : '';
    
    return (
      <div 
        className={`bg-white rounded-lg shadow-md overflow-hidden ${hoverEffect} ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  };
  
  export default Card;
  