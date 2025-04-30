import { Button as ButtonComponent } from "../ui/button"

export const Button = ({ onClick, icon, text, ...props}) => {
  return (
    <ButtonComponent
        {...props}
        className={`w-full sm:w-auto bg-tertiary hover:bg-tertiary/70 ${props.className}`}
        onClick={onClick}
    >
        {icon && (
            <span className="mr-2 text-white">{icon}</span>
        )}
        {text}
    </ButtonComponent>
  )
}