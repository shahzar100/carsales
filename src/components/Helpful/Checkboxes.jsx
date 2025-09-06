import React, { useState, useEffect } from 'react';
import { useFilters } from '@/store/FilterContext';

const Checkboxes = ({ title, disabled, type }) => {
	const { state, dispatch } = useFilters(); // Get the filter state and dispatch function from the filter context
	const [isSelected, setIsSelected] = useState(false);

	useEffect(() => {
		setIsSelected(state.Brand.includes(title)); // Set the isSelected state based on whether the title is included in the Brand filter array
	}, [state.Brand, title]);

	const handleChange = () => {
		setIsSelected(!isSelected); // Toggle the isSelected state

		// Toggle the selected option in the Brand filter
		dispatch({
			type: 'TOGGLE_FILTER',
			payload: { filterType: type, option: title }
		});
	};

	return (
		<div className='gap-4 py-4 cursor-pointer flex' onClick={handleChange}>
			<button
				className={` ${isSelected ? 'bg-blue-500' : 'bg-transparent'} w-8 h-8 border-2 rounded-md hover:bg-blue-300`}
				onClick={(e) => { e.stopPropagation(); handleChange() }}
			></button>
			<p>{title}</p>
		</div>
	);
};

export default Checkboxes;
