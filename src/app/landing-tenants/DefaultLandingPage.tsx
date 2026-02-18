import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import HeroSection from './components/DefaultHeroSection';

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
		tuterapeuta: 'Incluido'
	},
	{
		item: 'Programación',
		traditional: '$8,000 – $20,000 MXN',
		tuterapeuta: 'Incluido'
	},
	{
		item: 'Base de datos',
		traditional: '$3,000+ MXN',
		tuterapeuta: 'Incluido'
	},
	{
		item: 'Sistema de citas',
		traditional: '$5,000+ MXN',
		tuterapeuta: 'Incluido'
	},
	{
		item: 'Mantenimiento',
		traditional: 'Mensual',
		tuterapeuta: 'Incluido'
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
					Crear una página tradicional vs tuterapeuta
				</h2>

				<div className='overflow-x-auto'>
					<table className='w-full border border-border rounded-xl overflow-hidden'>
						<thead className='bg-surface'>
							<tr>
								<th className='p-4 text-left'>Servicio</th>
								<th className='p-4'>Con programador</th>
								<th className='p-4 text-primary'>tuterapeuta</th>
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
										{row.tuterapeuta}
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
						href='/admin/login'
						prefetch
						className='mt-6 inline-block bg-primary text-primaryForeground px-10 py-4 rounded-xl font-semibold hover:scale-105 transition'
					>
						Crear mi página ahora
					</Link>
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
					href='/admin/login'
					prefetch
					className='mt-8 inline-block bg-primary text-primaryForeground px-12 py-5 rounded-xl text-lg font-semibold shadow-lg hover:scale-105 transition'
				>
					Crear mi página en minutos
				</Link>
			</section>

			{/* FOOTER */}
			<footer className='border-t border-border py-8 text-center text-sm text-mutedForeground'>
				© {new Date().getFullYear()} tuterapeuta.com.mx — Todos los derechos
				reservados
			</footer>
		</div>
	);
}
