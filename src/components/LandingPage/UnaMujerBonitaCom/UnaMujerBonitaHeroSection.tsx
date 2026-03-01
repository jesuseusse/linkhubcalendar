'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function UnMujerBonitaHeroSection() {
	return (
		<section className='relative overflow-hidden bg-background'>
			<div className='max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center'>
				{/* TEXTO */}
				<div>
					{/* Badge autoridad */}
					<div className='inline-block bg-surface px-4 py-2 rounded-full text-sm text-mutedForeground mb-6 border border-border'>
						Más de 500 negocios ya venden con su página propia
					</div>

					<h1 className='text-4xl md:text-5xl font-bold leading-tight'>
						Consigue más clientas para tu negocio en el mundo de la mujer
						<span className='text-primary'>
							{' '}
							sin depender solo de Instagram
						</span>
					</h1>

					<p className='mt-6 text-lg text-mutedForeground max-w-xl'>
						Ideal para manicure, cejas, masajes, peinados, joyería y accesorios.
						Muestra tus productos o servicios, recibe citas o pedidos
						automáticos y aparece en Google.
					</p>

					{/* CTA */}
					<div className='mt-8 flex flex-col sm:flex-row gap-4'>
						<Link
							href='u/admin/login?mode=signup'
							className='bg-primary text-primaryForeground px-8 py-4 rounded-xl font-semibold text-center hover:scale-105 transition shadow-lg'
						>
							Crear mi página ahora
						</Link>

						<div className='flex items-center text-sm text-mutedForeground'>
							Sin comisiones · Sin conocimientos técnicos
						</div>
					</div>

					{/* Micro prueba social */}
					<div className='mt-8 flex items-center gap-4'>
						<div className='flex -space-x-3'>
							<Image
								src='/unamujerbonita/clienta1.jpg'
								alt='mujer realizando manicure profesional en su estudio moderno'
								width={40}
								height={40}
								className='w-10 h-10 rounded-full border-2 border-background object-cover'
							/>
							{/* imagen: profesional de uñas trabajando */}

							<Image
								src='/unamujerbonita/clienta2.jpg'
								alt='emprendedora mostrando joyería artesanal para mujer'
								width={40}
								height={40}
								className='w-10 h-10 rounded-full border-2 border-background object-cover'
							/>
							{/* imagen: mujer mostrando aretes o collares en fondo elegante */}

							<Image
								src='/unamujerbonita/clienta3.jpg'
								alt='dueña de tienda de accesorios femeninos empacando pedidos'
								width={40}
								height={40}
								className='w-10 h-10 rounded-full border-2 border-background object-cover'
							/>
							{/* imagen: mujer empacando pedidos de accesorios */}
						</div>

						<p className='text-sm text-mutedForeground'>
							Nuevas clientas y pedidos cada semana
						</p>
					</div>
				</div>

				{/* IMAGEN PRINCIPAL */}
				<div className='relative'>
					<Image
						src='/unamujerbonita/hero-belleza.jpg'
						alt='mujer emprendedora en estudio de belleza y accesorios usando laptop para gestionar su negocio'
						width={600}
						height={400}
						className='rounded-2xl shadow-2xl border border-border'
					/>
					{/* imagen ideal:
					    Mujer joven emprendedora,
					    mezcla de belleza + accesorios,
					    laptop abierta mostrando pedidos o agenda,
					    ambiente moderno femenino premium
					*/}

					{/* Caja flotante dinámica */}
					<div className='absolute -bottom-6 -left-6 bg-surface p-4 rounded-xl border border-border shadow-lg hidden md:block'>
						<div className='text-sm text-mutedForeground'>
							Nuevo pedido recibido
						</div>
						<div className='font-semibold'>Aretes + Collar · Hoy 3:15pm</div>
					</div>
				</div>
			</div>
		</section>
	);
}
