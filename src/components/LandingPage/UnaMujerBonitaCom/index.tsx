import Link from 'next/link';
import UnMujerBonitaHeroSection from './UnaMujerBonitaHeroSection';
import Image from 'next/image';

type Testimonial = {
	name: string;
	role: string;
	text: string;
	rating: number;
	image: string;
};

const testimonials: Testimonial[] = [
	{
		name: 'Fernanda Gómez',
		role: 'Especialista en uñas y manicure',
		text: 'En menos de una semana ya tenía nuevas clientas agendando solas desde mi página.',
		rating: 5,
		image: '/unamujerbonita/fernanda.jpg'
	},
	{
		name: 'Valeria Torres',
		role: 'Diseñadora de cejas y pestañas',
		text: 'Ahora mis clientas ven mis trabajos, precios y reservan sin preguntarme todo por WhatsApp.',
		rating: 5,
		image: '/unamujerbonita/valeria.jpg'
	},
	{
		name: 'Daniela Ruiz',
		role: 'Masajista profesional',
		text: 'Aparecer en Google me trajo nuevas clientas cada semana sin pagar anuncios.',
		rating: 5,
		image: '/unamujerbonita/daniela.jpg'
	}
];

const features = [
	{
		title: 'Tu perfil profesional de belleza',
		desc: 'Comparte un solo link con tus servicios, fotos, precios y ubicación.'
	},
	{
		title: 'WhatsApp y redes conectadas',
		desc: 'Recibe mensajes directos y conecta tu Instagram o TikTok fácilmente.'
	},
	{
		title: 'Galería de trabajos',
		desc: 'Muestra fotos de uñas, cejas, peinados o masajes para atraer más clientas.'
	},
	{
		title: 'Agenda citas automática',
		desc: 'Tus clientas reservan solas sin llamadas ni mensajes repetitivos.'
	},
	{
		title: 'Aparece en Google',
		desc: 'Cuando buscan “uñas cerca de mí” o “masajes en [tu ciudad]”, pueden encontrarte.'
	}
];

const comparison = [
	{
		item: 'Diseño profesional',
		traditional: '$5,000 – $12,000 MXN',
		tubelleza: 'Incluido'
	},
	{
		item: 'Programación',
		traditional: '$8,000 – $20,000 MXN',
		tubelleza: 'Incluido'
	},
	{
		item: 'Sistema de citas',
		traditional: '$5,000+ MXN',
		tubelleza: 'Incluido'
	},
	{
		item: 'Optimización para Google',
		traditional: '$3,000+ MXN',
		tubelleza: 'Incluido'
	},
	{
		item: 'Mantenimiento',
		traditional: 'Mensual',
		tubelleza: 'Incluido'
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
			{/* HERO */}
			<UnMujerBonitaHeroSection />

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
						'Agrega tus servicios y fotos',
						'Activa WhatsApp o agenda',
						'Comparte tu link y recibe clientas'
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
						Profesionales de belleza que ya están creciendo
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
										alt='mujer profesional de belleza en su spa o estudio mostrando su trabajo'
										className='w-14 h-14 rounded-full object-cover border border-border'
										width={56}
										height={56}
									/>
									{/* insertar imagen real de mujer trabajando en uñas / cejas / masaje */}

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
					Crear una página tradicional vs tubelleza
				</h2>

				<div className='overflow-x-auto'>
					<table className='w-full border border-border rounded-xl overflow-hidden'>
						<thead className='bg-surface'>
							<tr>
								<th className='p-4 text-left'>Servicio</th>
								<th className='p-4'>Con programador</th>
								<th className='p-4 text-primary'>tubelleza</th>
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
										{row.tubelleza}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				<div className='text-center mt-10'>
					<div className='text-5xl font-bold text-primary'>$200 MXN</div>
					<p className='text-mutedForeground mt-2'>
						Plan Pro mensual — todo incluido
					</p>

					<Link
						href='u/admin/login'
						className='mt-6 inline-block bg-primary text-primaryForeground px-10 py-4 rounded-xl font-semibold hover:scale-105 transition'
					>
						Crear mi página ahora
					</Link>
				</div>
			</section>

			{/* SEO SECTION */}
			<section className='bg-surface py-16 text-center px-6'>
				<h2 className='text-2xl font-bold mb-4'>
					Tus clientas te encuentran en Google
				</h2>

				<p className='max-w-2xl mx-auto text-mutedForeground'>
					Cuando alguien busca “manicure cerca de mí”, “cejas en Toluca” o
					“masajes relajantes en [tu ciudad]”, tu página puede aparecer. Más
					visibilidad sin pagar anuncios.
				</p>
			</section>

			{/* CTA FINAL */}
			<section className='py-20 text-center'>
				<h2 className='text-4xl font-bold'>
					Empieza hoy tu presencia profesional
				</h2>

				<p className='mt-4 text-mutedForeground'>
					Sin diseñadores. Sin complicaciones. Sin estrés.
				</p>

				<Link
					href='u/admin/login'
					className='mt-8 inline-block bg-primary text-primaryForeground px-12 py-5 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition'
				>
					Crear mi página en minutos
				</Link>
			</section>

			<footer className='border-t border-border py-8 text-center text-sm text-mutedForeground'>
				© {new Date().getFullYear()} unamujerbonita.com — Todos los derechos
				reservados
			</footer>
		</div>
	);
}
