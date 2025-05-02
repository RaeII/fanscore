import { Button as ButtonComponent } from "../ui/button"

export const Button = ({ onClick, icon, text, ...props}) => {
  return (
    <ButtonComponent
        {...props}
        className={`w-full sm:w-auto bg-primary hover:bg-primary/70 text-background color-primary ${props.className}`}
        onClick={onClick}
    >
        {icon && (
            <span className="mr-2 text-background">{icon}</span>
        )}
        {text}
    </ButtonComponent>
  )
}