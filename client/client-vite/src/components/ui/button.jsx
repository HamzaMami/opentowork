import * as React from "react"

// Simple function to combine class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

const buttonVariants = ({ variant = "default", size = "default", className = "" }) => {
  const baseClasses = "btn"
  const variantClasses = {
    default: "btn-default",
    destructive: "btn-destructive",
    outline: "btn-outline",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
    link: "btn-link",
  }
  
  const sizeClasses = {
    default: "btn-size-default",
    sm: "btn-size-sm",
    lg: "btn-size-lg",
    icon: "btn-size-icon",
  }
  
  return cn(
    baseClasses, 
    variantClasses[variant],
    sizeClasses[size],
    className
  )
}

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants }