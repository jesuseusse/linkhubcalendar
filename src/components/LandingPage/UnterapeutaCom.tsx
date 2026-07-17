import Image from 'next/image';
import Link from 'next/link';
import HeroSection from './UnterapeutaHeroSection';

type Testimonial = {
	name: string;
	role: string;
	text: string;
	rating: number;
	image: string;
};

const testimonials: Testimonial[] = [
	{
		name: 'Dra. Mariana López',
		role: 'Psicóloga Clínica',
		text: 'En menos de 10 minutos ya tenía mi página profesional funcionando y empecé a recibir contactos.',
		rating: 5,
		image: '/default/testimonials/mariana.png'
	},
	{
		name: 'Carlos Hernández',
		role: 'Terapeuta Holístico',
		text: 'Ahora mis pacientes pueden agendar solos. Me ahorra muchísimo tiempo.',
		rating: 5,
		image: '/default/testimonials/carlos.png'
	},
	{
		name: 'Lic. Andrea Ruiz',
		role: 'Psicoterapeuta',
		text: 'Aparecer en Google cambió todo. Nuevos pacientes cada semana.',
		rating: 5,
		image: '/default/testimonials/andrea.png'
	}
];

const features = [
	{
		title: 'Tu tarjeta profesional personalizada',
		desc: 'Comparte un solo link con tu foto, descripción y toda tu información profesional.'
	},
	{
		title: 'Links y contacto directo',
		desc: 'Agrega WhatsApp, redes sociales y ubicación para que te contacten fácilmente.'
	},
	{
		title: 'Formulario de contacto',
		desc: 'Recibe mensajes desde tu página y adminístralos desde tu panel.'
	},
	{
		title: 'Agenda citas automáticamente',
		desc: 'Tus pacientes reservan sin llamadas ni mensajes innecesarios.'
	},
	{
		title: 'Aparece en Google (SEO)',
		desc: 'Tu perfil está optimizado para que personas que buscan terapia puedan encontrarte fácilmente.'
	}
];

const comparison = [
	{
		item: 'Diseño profesional',
		traditional: '$5,000 – $12,000 MXN',
		unterapeuta: 'Incluido'
	},
	{
		item: 'Programación',
		traditional: '$8,000 – $20,000 MXN',
		unterapeuta: 'Incluido'
	},
	{
		item: 'Base de datos',
		traditional: '$3,000+ MXN',
		unterapeuta: 'Incluido'
	},
	{
		item: 'Sistema de citas',
		traditional: '$5,000+ MXN',
		unterapeuta: 'Incluido'
	},
	{
		item: 'Mantenimiento',
		traditional: 'Mensual',
		unterapeuta: 'Incluido'
	}
];

const StarRating = ({ rating }: { rating: number }) => (
	<div className='flex gap-1'>
		{Array.from({ length: rating }).map((_, i) => (
			<span key={i}>⭐</span>
		))}
	</div>
);

export default function DefaultLandingPage() {
	return (
		<div className='bg-background text-foreground'>
			{/* HEADER */}
			<header className='sticky top-0 z-50 bg-background border-b border-border'>
				<div className='max-w-7xl mx-auto px-6 h-16 flex items-center justify-between'>
					<span className='font-bold text-lg text-primary'> </span>
					<Link
						href='u/admin/login'
						className='bg-primary text-primaryForeground px-5 py-2 rounded-xl font-semibold text-sm hover:scale-105 transition'
					>
						Inicia sesión
					</Link>
				</div>
			</header>

			{/* HERO */}
			<HeroSection />

			{/* FEATURES */}
			<section className='bg-surface py-20'>
				<div className='max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8'>
					{features.map(f => (
						<div
							key={f.title}
							className='bg-background p-6 rounded-xl border border-border'
						>
							<h3 className='font-semibold text-lg mb-2'>{f.title}</h3>
							<p className='text-mutedForeground'>{f.desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* HOW IT WORKS */}
			<section className='max-w-5xl mx-auto px-6 py-20 text-center'>
				<h2 className='text-3xl font-bold mb-12'>Empieza en solo 4 pasos</h2>

				<div className='grid md:grid-cols-4 gap-6 text-left'>
					{[
						'Crea tu cuenta',
						'Agrega tu perfil profesional',
						'Activa contacto o citas',
						'Comparte tu link y recibe pacientes'
					].map((step, i) => (
						<div
							key={step}
							className='bg-surface p-6 rounded-xl border border-border'
						>
							<div className='text-primary font-bold text-xl mb-2'>{i + 1}</div>
							<p>{step}</p>
						</div>
					))}
				</div>
			</section>

			{/* TESTIMONIALS */}
			<section className='bg-surfaceAlt py-20'>
				<div className='max-w-6xl mx-auto px-6 text-center'>
					<h2 className='text-3xl font-bold mb-12'>
						Profesionales que ya crecieron su consulta
					</h2>

					<div className='grid md:grid-cols-3 gap-8'>
						{testimonials.map(t => (
							<div
								key={t.name}
								className='bg-background p-6 rounded-xl border border-border hover:shadow-lg transition'
							>
								<div className='flex items-center gap-4'>
									<Image
										src={t.image}
										alt={t.name}
										className='w-14 h-14 rounded-full object-cover border border-border'
										width={180}
										height={180}
									/>

									<div>
										<div className='font-semibold'>{t.name}</div>
										<div className='text-sm text-mutedForeground'>{t.role}</div>
									</div>
								</div>

								<StarRating rating={t.rating} />

								<p className='mt-4 text-mutedForeground leading-relaxed'>
									“{t.text}”
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* PRICE COMPARISON */}
			<section className='max-w-6xl mx-auto px-6 py-20'>
				<h2 className='text-3xl font-bold text-center mb-12'>
					Crear una página tradicional vs unterapeuta
				</h2>

				<div className='overflow-x-auto'>
					<table className='w-full border border-border rounded-xl overflow-hidden'>
						<thead className='bg-surface'>
							<tr>
								<th className='p-4 text-left'>Servicio</th>
								<th className='p-4'>Con programador</th>
								<th className='p-4 text-primary'>unterapeuta</th>
							</tr>
						</thead>
						<tbody>
							{comparison.map(row => (
								<tr key={row.item} className='border-t border-border'>
									<td className='p-4'>{row.item}</td>
									<td className='p-4 text-center text-mutedForeground'>
										{row.traditional}
									</td>
									<td className='p-4 text-center font-semibold text-success'>
										{row.unterapeuta}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* PRICING PLANS */}
				<div className='mt-16'>
					<div className='text-center mb-10'>
						<span className='inline-flex items-center gap-2 bg-accent/10 text-accent border border-accent/30 px-5 py-2 rounded-full text-sm font-semibold'>
							🎁 3 meses gratis en cualquier plan — Promoción por tiempo
							limitado
						</span>
					</div>

					<div className='grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto items-stretch'>
						{/* MONTHLY */}
						<div className='flex flex-col bg-surface border border-border rounded-2xl p-8'>
							<h3 className='font-semibold text-mutedForeground'>
								Plan Mensual
							</h3>
							<div className='mt-3 flex items-baseline gap-2'>
								<span className='text-4xl font-bold'>$75</span>
								<span className='text-mutedForeground text-sm'>MXN / mes</span>
							</div>
							<p className='mt-2 text-sm font-medium text-success'>
								+ 3 meses gratis al empezar
							</p>
							<ul className='mt-6 space-y-2 text-sm text-mutedForeground flex-1'>
								<li>✓ Todo incluido, sin costos ocultos</li>
								<li>✓ Cancela cuando quieras</li>
							</ul>
							<Link
								href='u/admin/login?mode=signup'
								prefetch
								className='mt-8 inline-block text-center border border-border px-6 py-3 rounded-xl font-semibold hover:scale-105 transition'
							>
								Crear mi página ahora
							</Link>
						</div>

						{/* ANNUAL — highlighted */}
						<div className='relative flex flex-col bg-primary text-primaryForeground rounded-2xl p-8 shadow-xl md:-translate-y-2'>
							<span className='absolute -top-3 left-1/2 -translate-x-1/2 bg-primaryForeground text-primary px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-md'>
								Mejor precio · Ahorra más
							</span>
							<h3 className='font-semibold text-primaryForeground/80'>
								Plan Anual
							</h3>
							<div className='mt-3 flex items-baseline gap-2'>
								<span className='text-4xl font-bold'>$500</span>
								<span className='text-primaryForeground/80 text-sm'>
									MXN / año
								</span>
							</div>
							<p className='mt-2 text-sm font-medium'>
								+ 3 meses gratis al empezar
							</p>
							<ul className='mt-6 space-y-2 text-sm text-primaryForeground/90 flex-1'>
								<li>✓ Todo incluido, sin costos ocultos</li>
								<li>✓ Precio congelado todo el año</li>
							</ul>
							<Link
								href='u/admin/login?mode=signup'
								prefetch
								className='mt-8 inline-block text-center bg-background text-foreground px-6 py-3 rounded-xl font-semibold hover:scale-105 transition'
							>
								Crear mi página ahora
							</Link>
						</div>
					</div>

					<p className='text-center text-xs text-mutedForeground mt-8'>
						* Los 3 meses gratis aplican al activar tu cuenta durante la
						promoción. Al finalizar, se cobra el precio del plan elegido.
					</p>
				</div>
			</section>

			{/* SEO EXPLANATION */}
			<section className='bg-surface py-16 text-center px-6'>
				<h2 className='text-2xl font-bold mb-4'>
					Te encuentran en Google automáticamente
				</h2>

				<p className='max-w-2xl mx-auto text-mutedForeground'>
					Cuando alguien busca “terapeuta cerca de mí” o tu especialidad, Google
					puede mostrar tu página. Esto significa más personas encontrándote sin
					pagar publicidad.
				</p>
			</section>

			{/* CTA FINAL */}
			<section className='py-20 text-center'>
				<h2 className='text-4xl font-bold'>
					Empieza hoy tu presencia profesional
				</h2>

				<p className='mt-4 text-mutedForeground'>
					Sin diseño complicado. Sin programadores. Sin estrés.
				</p>

				<Link
					href='u/admin/login?mode=signup'
					prefetch
					className='mt-8 inline-block bg-primary text-primaryForeground px-12 py-5 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition'
				>
					Crear mi página en minutos
				</Link>
			</section>

			{/* FOOTER */}
			<footer className='border-t border-border py-8 text-center text-sm text-mutedForeground'>
				© {new Date().getFullYear()} unterapeuta.com.mx — Todos los derechos
				reservados
			</footer>
		</div>
	);
}
