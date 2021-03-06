import React, { PropTypes } from 'react';
import Radium, { Style } from 'radium';
import Select from 'react-select';
import SelectOption from 'components/SelectOption/SelectOption';
import SelectValue from 'components/SelectValue/SelectValue';
import { Button } from '@blueprintjs/core';
import 'react-select/dist/react-select.css';

let styles = {};

export const AutoCompleteBar = React.createClass({
	propTypes: {
		filterOptions: PropTypes.func,
		placeholder: PropTypes.string,
		loadOptions: PropTypes.func,
		value: PropTypes.object,
		onChange: PropTypes.func,
		onComplete: PropTypes.func,
		completeLoading: PropTypes.bool,
		completeDisabled: PropTypes.bool,
	},

	render: function() {
		return (
			<div className={'autocomplete-bar'} style={styles.addControlGroup}>
				<Style rules={{
					'.autocomplete-bar .Select': { display: 'table-cell', width: '100%' },
					'.autocomplete-bar .Select-control': { borderRadius: '2px 0px 0px 2px'},
				}} />
				<Select.Async
					name="form-field-name"
					autoload={false}
					minimumInput={3}
					value={this.props.value}
					loadOptions={this.props.loadOptions}
					placeholder={this.props.placeholder}
					filterOptions={this.props.filterOptions}
					onChange={this.props.onChange}
					optionComponent={SelectOption}
					valueComponent={SelectValue} />
				<Button loading={this.props.completeLoading} onClick={this.props.onComplete} style={styles.addControlButton} className={this.props.completeDisabled ? 'pt-button pt-intent-primary pt-disabled' : 'pt-button pt-intent-primary'} text={this.props.completeString} />
			</div>
		);
	}
});

export default Radium(AutoCompleteBar);

styles = {
	addControlGroup: {
		display: 'table',
		margin: '1em 0em',
		width: '100%',
	},
	addControlButton: {
		display: 'table-cell',
		height: 'calc(100% + 2px)',
		borderRadius: '0px 2px 2px 0px',
		whiteSpace: 'nowrap',
		padding: '3px 10px',
	},
};
