import { ThemeDto } from '@/dtos/user.dto';

interface Props {
	theme: ThemeDto;
	name?: string;
	username?: string;
}

export function ProfilePreview({
	theme,
	name = 'Tu nombre',
	username = 'usuario',
}: Props) {
	return (
		<div
			className='rounded-2xl px-5 py-6 flex flex-col items-center gap-4'
			style={{ backgroundColor: theme.backgroundColor }}
		>
			{/* Avatar */}
			<div
				className='w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold'
				style={{
					backgroundColor: theme.buttonColor,
					color: theme.buttonTextColor,
					boxShadow: `0 0 0 3px ${theme.buttonColor}25, 0 8px 20px ${theme.buttonColor}30`,
				}}
			>
				{name.charAt(0).toUpperCase()}
			</div>

			{/* Name & handle */}
			<div className='text-center'>
				<p className='text-sm font-bold tracking-tight' style={{ color: theme.textColor }}>
					{name}
				</p>
				<p className='text-xs mt-0.5' style={{ color: `${theme.textColor}70` }}>
					@{username}
				</p>
			</div>

			{/* Sample links */}
			<div className='w-full space-y-2'>
				<div
					className='flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold shadow-sm'
					style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}
				>
					<span className='material-icons text-sm' aria-hidden='true'>
						link
					</span>
					<span className='flex-1 text-center pr-4'>Mi sitio web</span>
				</div>
				<div
					className='flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold border-2'
					style={{
						borderColor: theme.accentColor,
						color: theme.accentColor,
						backgroundColor: `${theme.accentColor}0d`,
					}}
				>
					<span className='material-icons text-sm' aria-hidden='true'>
						calendar_month
					</span>
					Ver calendario
				</div>
			</div>
		</div>
	);
}
