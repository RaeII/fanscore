import { Button } from "./button";

/**
 * @typedef {Object} Cta11Props
 * @property {string} heading - Título principal
 * @property {string} description - Descrição do CTA
 * @property {Object} [buttons] - Botões de ação
 * @property {Object} [buttons.primary] - Botão primário
 * @property {string} [buttons.primary.text] - Texto do botão primário
 * @property {function} [buttons.primary.onClick] - Função a ser chamada ao clicar no botão primário
 * @property {React.ReactNode} [buttons.primary.icon] - Ícone a ser exibido no botão primário
 * @property {Object} [buttons.secondary] - Botão secundário
 * @property {string} [buttons.secondary.text] - Texto do botão secundário
 * @property {function} [buttons.secondary.onClick] - Função a ser chamada ao clicar no botão secundário
 * @property {React.ReactNode} [buttons.secondary.icon] - Ícone a ser exibido no botão secundário
 * @property {string} [className] - Classes CSS adicionais
 */

/**
 * Componente de Call to Action 
 * @param {Cta11Props} props
 */
const Cta11 = ({
  heading = "Pronto para Começar?",
  description = "Junte-se a milhares de torcedores usando nossa plataforma para ter uma experiência única nos estádios.",
  buttons = {
    primary: {
      text: "Começar",
      onClick: () => {},
      icon: null,
    },
    secondary: {
      text: "Saiba Mais",
      onClick: () => {},
      icon: null,
    },
  },
  className = "",
}) => {
  return (
    <section className={`py-12 md:py-20 lg:py-32 ${className}`}>
      <div className="container flex items-center justify-center">
        <div className="flex flex-col items-center rounded-lg bg-white dark:bg-[#150924] p-8 text-center md:rounded-xl lg:p-16 shadow-md w-full max-w-4xl">
          <h3 className="mb-3 max-w-3xl text-2xl font-semibold md:mb-4 md:text-4xl lg:mb-6 text-primary dark:text-white">
            {heading}
          </h3>
          <p className="mb-8 max-w-3xl text-primary/70 dark:text-white/70 lg:text-lg">
            {description}
          </p>
          <div className="flex w-full flex-col justify-center gap-2 sm:flex-row">
            {buttons.secondary && (
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={buttons.secondary.onClick}
              >
                {buttons.secondary.icon && (
                  <span className="mr-2">{buttons.secondary.icon}</span>
                )}
                {buttons.secondary.text}
              </Button>
            )}
            {buttons.primary && (
              <Button 
                className="w-full sm:w-auto bg-secondary text-white"
                onClick={buttons.primary.onClick}
              >
                {buttons.primary.icon && (
                  <span className="mr-2">{buttons.primary.icon}</span>
                )}
                {buttons.primary.text}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export { Cta11 }; 