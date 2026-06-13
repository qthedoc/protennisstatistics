import type { Player } from '$lib/types';

export const wtaPlayers: Player[] = [
	{
		rank: 1,
		name: 'Aryna Sabalenka',
		country: 'Belarus',
		country_code: 'BY',
		current_points: 11480,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'SF', points_earned: 780 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'W', points_earned: 1000 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'W', points_earned: 2000 },
			{ event_name: 'China Open', event_type: '1000', event_date_start: '2025-09-22', event_date_end: '2025-09-29', result: 'F', points_earned: 650 },
			{ event_name: 'Wuhan Open', event_type: '1000', event_date_start: '2025-09-29', event_date_end: '2025-10-05', result: 'W', points_earned: 1000 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'W', points_earned: 2000 },
			{ event_name: 'Dubai Duty Free', event_type: '500', event_date_start: '2026-02-17', event_date_end: '2026-02-22', result: 'W', points_earned: 470 },
			{ event_name: 'Indian Wells Masters', event_type: '1000', event_date_start: '2026-03-08', event_date_end: '2026-03-22', result: 'F', points_earned: 650 },
			{ event_name: 'Madrid Open', event_type: '1000', event_date_start: '2026-04-24', event_date_end: '2026-05-04', result: 'SF', points_earned: 390 },
		]
	},
	{
		rank: 2,
		name: 'Iga Świątek',
		country: 'Poland',
		country_code: 'PL',
		current_points: 10640,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'R16', points_earned: 240 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'F', points_earned: 650 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'SF', points_earned: 780 },
			{ event_name: 'China Open', event_type: '1000', event_date_start: '2025-09-22', event_date_end: '2025-09-29', result: 'W', points_earned: 1000 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'QF', points_earned: 430 },
			{ event_name: 'Doha Open', event_type: '500', event_date_start: '2026-02-10', event_date_end: '2026-02-15', result: 'W', points_earned: 470 },
			{ event_name: 'Indian Wells Masters', event_type: '1000', event_date_start: '2026-03-08', event_date_end: '2026-03-22', result: 'SF', points_earned: 390 },
			{ event_name: 'Rome Masters', event_type: '1000', event_date_start: '2026-05-11', event_date_end: '2026-05-18', result: 'W', points_earned: 1000 },
			{ event_name: 'French Open', event_type: 'Grand Slam', event_date_start: '2026-05-25', event_date_end: '2026-06-08', result: 'W', points_earned: 2000 },
		]
	},
	{
		rank: 3,
		name: 'Coco Gauff',
		country: 'United States',
		country_code: 'US',
		current_points: 8060,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'QF', points_earned: 430 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'SF', points_earned: 390 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'F', points_earned: 1300 },
			{ event_name: 'China Open', event_type: '1000', event_date_start: '2025-09-22', event_date_end: '2025-09-29', result: 'SF', points_earned: 390 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'SF', points_earned: 780 },
			{ event_name: 'Indian Wells Masters', event_type: '1000', event_date_start: '2026-03-08', event_date_end: '2026-03-22', result: 'W', points_earned: 1000 },
			{ event_name: 'Miami Open', event_type: '1000', event_date_start: '2026-03-23', event_date_end: '2026-04-06', result: 'F', points_earned: 650 },
			{ event_name: 'French Open', event_type: 'Grand Slam', event_date_start: '2026-05-25', event_date_end: '2026-06-08', result: 'QF', points_earned: 430 },
		]
	},
	{
		rank: 4,
		name: 'Elena Rybakina',
		country: 'Kazakhstan',
		country_code: 'KZ',
		current_points: 6840,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'W', points_earned: 2000 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'QF', points_earned: 215 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'QF', points_earned: 430 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'F', points_earned: 1300 },
			{ event_name: 'Doha Open', event_type: '500', event_date_start: '2026-02-10', event_date_end: '2026-02-15', result: 'F', points_earned: 255 },
			{ event_name: 'Miami Open', event_type: '1000', event_date_start: '2026-03-23', event_date_end: '2026-04-06', result: 'SF', points_earned: 390 },
			{ event_name: 'Rome Masters', event_type: '1000', event_date_start: '2026-05-11', event_date_end: '2026-05-18', result: 'SF', points_earned: 390 },
		]
	},
	{
		rank: 5,
		name: 'Jessica Pegula',
		country: 'United States',
		country_code: 'US',
		current_points: 5180,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'R16', points_earned: 240 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'SF', points_earned: 390 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'QF', points_earned: 430 },
			{ event_name: 'Wuhan Open', event_type: '1000', event_date_start: '2025-09-29', event_date_end: '2025-10-05', result: 'F', points_earned: 650 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'R16', points_earned: 240 },
			{ event_name: 'Indian Wells Masters', event_type: '1000', event_date_start: '2026-03-08', event_date_end: '2026-03-22', result: 'QF', points_earned: 215 },
			{ event_name: 'Miami Open', event_type: '1000', event_date_start: '2026-03-23', event_date_end: '2026-04-06', result: 'W', points_earned: 1000 },
		]
	},
	{
		rank: 6,
		name: 'Qinwen Zheng',
		country: 'China',
		country_code: 'CN',
		current_points: 4740,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'QF', points_earned: 430 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'SF', points_earned: 780 },
			{ event_name: 'China Open', event_type: '1000', event_date_start: '2025-09-22', event_date_end: '2025-09-29', result: 'SF', points_earned: 390 },
			{ event_name: 'Wuhan Open', event_type: '1000', event_date_start: '2025-09-29', event_date_end: '2025-10-05', result: 'SF', points_earned: 390 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'QF', points_earned: 430 },
			{ event_name: 'Dubai Duty Free', event_type: '500', event_date_start: '2026-02-17', event_date_end: '2026-02-22', result: 'SF', points_earned: 255 },
			{ event_name: 'Madrid Open', event_type: '1000', event_date_start: '2026-04-24', event_date_end: '2026-05-04', result: 'QF', points_earned: 215 },
			{ event_name: 'French Open', event_type: 'Grand Slam', event_date_start: '2026-05-25', event_date_end: '2026-06-08', result: 'QF', points_earned: 430 },
		]
	},
	{
		rank: 7,
		name: 'Mirra Andreeva',
		country: 'Russia',
		country_code: 'RU',
		current_points: 4080,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'QF', points_earned: 430 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'QF', points_earned: 215 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'R16', points_earned: 240 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'SF', points_earned: 780 },
			{ event_name: 'Doha Open', event_type: '500', event_date_start: '2026-02-10', event_date_end: '2026-02-15', result: 'SF', points_earned: 255 },
			{ event_name: 'Miami Open', event_type: '1000', event_date_start: '2026-03-23', event_date_end: '2026-04-06', result: 'QF', points_earned: 215 },
			{ event_name: 'Rome Masters', event_type: '1000', event_date_start: '2026-05-11', event_date_end: '2026-05-18', result: 'F', points_earned: 650 },
			{ event_name: 'French Open', event_type: 'Grand Slam', event_date_start: '2026-05-25', event_date_end: '2026-06-08', result: 'R16', points_earned: 240 },
		]
	},
	{
		rank: 8,
		name: 'Jasmine Paolini',
		country: 'Italy',
		country_code: 'IT',
		current_points: 3860,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'F', points_earned: 1300 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'R16', points_earned: 240 },
			{ event_name: 'China Open', event_type: '1000', event_date_start: '2025-09-22', event_date_end: '2025-09-29', result: 'R16', points_earned: 100 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'R16', points_earned: 240 },
			{ event_name: 'Dubai Duty Free', event_type: '500', event_date_start: '2026-02-17', event_date_end: '2026-02-22', result: 'F', points_earned: 255 },
			{ event_name: 'Rome Masters', event_type: '1000', event_date_start: '2026-05-11', event_date_end: '2026-05-18', result: 'QF', points_earned: 215 },
			{ event_name: 'French Open', event_type: 'Grand Slam', event_date_start: '2026-05-25', event_date_end: '2026-06-08', result: 'SF', points_earned: 780 },
		]
	},
	{
		rank: 9,
		name: 'Madison Keys',
		country: 'United States',
		country_code: 'US',
		current_points: 3620,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'R16', points_earned: 240 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'QF', points_earned: 215 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'QF', points_earned: 430 },
			{ event_name: 'Wuhan Open', event_type: '1000', event_date_start: '2025-09-29', event_date_end: '2025-10-05', result: 'QF', points_earned: 215 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'W', points_earned: 2000 },
			{ event_name: 'Doha Open', event_type: '500', event_date_start: '2026-02-10', event_date_end: '2026-02-15', result: 'QF', points_earned: 120 },
		]
	},
	{
		rank: 10,
		name: 'Barbora Krejčíková',
		country: 'Czech Republic',
		country_code: 'CZ',
		current_points: 3340,
		points_distribution: [
			{ event_name: 'Wimbledon', event_type: 'Grand Slam', event_date_start: '2025-07-01', event_date_end: '2025-07-13', result: 'W', points_earned: 2000 },
			{ event_name: 'Rogers Cup', event_type: '1000', event_date_start: '2025-08-04', event_date_end: '2025-08-10', result: 'R16', points_earned: 100 },
			{ event_name: 'US Open', event_type: 'Grand Slam', event_date_start: '2025-08-25', event_date_end: '2025-09-07', result: 'R32', points_earned: 60 },
			{ event_name: 'Australian Open', event_type: 'Grand Slam', event_date_start: '2026-01-13', event_date_end: '2026-01-26', result: 'R16', points_earned: 240 },
			{ event_name: 'Indian Wells Masters', event_type: '1000', event_date_start: '2026-03-08', event_date_end: '2026-03-22', result: 'R16', points_earned: 100 },
			{ event_name: 'Prague Open', event_type: '250', event_date_start: '2026-04-21', event_date_end: '2026-04-27', result: 'W', points_earned: 280 },
			{ event_name: 'French Open', event_type: 'Grand Slam', event_date_start: '2026-05-25', event_date_end: '2026-06-08', result: 'QF', points_earned: 430 },
		]
	},
];
