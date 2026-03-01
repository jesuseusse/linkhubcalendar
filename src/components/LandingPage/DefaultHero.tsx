'use client';

import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

export default function HeroSection() {
	return (
		<section className='relative overflow-hidden'>
			{/* background glow */}
			<div className='absolute inset-0 bg-linear-to-b from-surface to-background pointer-events-none' />

			<div className='max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-14 items-center relative'>
				{/* LEFT CONTENT */}
				<div>
					<span className='inline-block bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-medium'>
						Plataforma creada para profesionales y negocios digitales
					</span>

					<h1 className='mt-6 text-4xl md:text-6xl font-bold leading-tight'>
						Haz crecer tu presencia online
						<span className='text-primary block'>
							con una página profesional
						</span>
					</h1>

					<p className='mt-6 text-lg text-mutedForeground max-w-xl'>
						Crea tu página en minutos, recibe contactos automáticamente y
						comparte un solo link con toda tu información profesional.
					</p>

					{/* CTA */}
					<div className='mt-8 flex gap-4 flex-wrap'>
						<Link
							href='u/admin/login?mode=signup'
							className='bg-primary text-primaryForeground px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition'
						>
							Crear mi página ahora
						</Link>
					</div>

					{/* TRUST */}
					<div className='mt-8 flex items-center gap-6 text-sm text-mutedForeground'>
						<div>⭐⭐⭐⭐⭐ 4.9/5 satisfacción</div>
						<div>+500 usuarios activos</div>
					</div>
				</div>

				{/* RIGHT VISUAL */}
				<div className='relative flex justify-center'>
					{/* Main Image */}
					<Image
						src='/default/hero.png'
						alt='Usuario utilizando su página profesional'
						className='rounded-2xl shadow-2xl border border-border relative z-10'
						width={350}
						height={350}
					/>

					{/* Floating Card — Activity */}
					<div className='ml-8 md:ml-0 lg:ml-2 absolute -left-10 top-10 bg-background border border-border rounded-xl shadow-xl p-4 w-52 animate-float z-20'>
						<p className='text-sm font-semibold'>Nueva actividad</p>
						<p className='text-xs text-mutedForeground mt-1'>
							Un usuario completó una acción
						</p>
						<span className='text-success text-xs font-medium'>
							Procesado ✓
						</span>
					</div>

					{/* Floating Card — Contact */}
					<div className='mr-8 md:mr-0 absolute -right-10 bottom-0 bg-background border border-border rounded-xl shadow-xl p-4 w-52 animate-float delay-200 z-20'>
						<p className='text-sm font-semibold'>Nuevo contacto</p>
						<p className='text-xs text-mutedForeground mt-1'>
							“Quisiera más información”
						</p>
						<span className='text-info text-xs font-medium'>Desde la web</span>
					</div>
				</div>
			</div>
		</section>
	);
}
