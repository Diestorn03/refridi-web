// La curva única de Refridi (CONCEPTO §2): respuesta críticamente amortiguada (ζ = 1, ω = 6), sin sobrepaso.
// En CSS es --ease-brand: cubic-bezier(.18, .05, .24, 1). Si se cambia ω, se cambian los 4 números aquí Y en tokens.css; nunca se añade otra.
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
CustomEase.create('brand', 'M0,0 C0.18,0.05 0.24,1 1,1');
gsap.defaults({ ease: 'brand' });

export { gsap, CustomEase };
