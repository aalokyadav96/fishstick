import { Button } from "../components/base/Button.js";
import { renderComponent } from "../components/helpers.js";

function Home() {

  const button = Button("Click Me", "button1", {
    click: () => alert("Button clicked!"),
    mouseenter: () => console.log("Button hovered"),
  });
  // Render components to the DOM
  renderComponent(button, 'content');
}

export { Home };