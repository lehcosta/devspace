import React from 'react';

import debounce from 'lodash.debounce';
import { Spinner } from 'elemental/lib/Elemental';

import Event from './event';
import Icon from './icon';
import { getIcon } from '../data/column';

class Column extends React.Component {
	constructor() {
		super();

		this.handleScroll = debounce(this.handleScroll.bind(this), 100);
	}

	componentDidMount() {
		this.props.fetchColumn(this.props.index, 1);
		this.startInterval();
	}

	shouldComponentUpdate(nextProps) {
		return nextProps.columns !== this.props.columns ||
			nextProps.error !== this.props.error ||
			nextProps.events !== this.props.events ||
			nextProps.hasUpdates !== this.props.hasUpdates ||
			nextProps.isFilterModalOpen !== this.props.isFilterModalOpen ||
			nextProps.isOnline !== this.props.isOnline ||
			nextProps.isVisible !== this.props.isVisible;
	}

	componentWillUpdate(nextProps) {
		// Error changes
		if (nextProps.error) {
			window.clearInterval(this.interval);
		}

		// Connectivity changes
		if (nextProps.isOnline === true) {
			this.maybeFetchColumn();
			this.startInterval();
		}
		else if (nextProps.isOnline === false) {
			window.clearInterval(this.interval);
		}

		// Visibility changes
		if (nextProps.isVisible === true) {
			this.maybeFetchColumn();
			this.startInterval();
		}
		else if (nextProps.isVisible === false) {
			window.clearInterval(this.interval);
		}
	}

	componentWillUnmount() {
		window.clearInterval(this.interval);
	}

	/* ======================================================================
	   Interval
	   ====================================================================== */

	startInterval() {
		this.interval = window.setInterval(() => {
			this.maybeFetchColumn();
		}, 60 * 1000);
	}

	/* ======================================================================
	   New Updates
	   ====================================================================== */

	maybeFetchColumn() {
		if (this.refs.wrap.scrollTop > 10) {
			if (this.props.hasUpdates !== 'appear') {
				this.props.checkUpdates(this.props.index);
			}
		} else {
			this.props.fetchColumn(this.props.index, 1);
		}
	}

	handleNewUpdatesButton() {
		this.props.setHasUpdates('disappear', this.props.index);
		this.props.fetchColumn(this.props.index, 1);
		this.refs.wrap.scrollTop = 0;

		mixpanel.track('Clicked New Updates');
	}

	handleScroll() {
		let scroll = this.refs.wrap.scrollTop;

		if (scroll <= 10 && this.props.hasUpdates === 'appear') {
			this.props.setHasUpdates('disappear', this.props.index);
			this.props.fetchColumn(this.props.index, 1);
		}
	}

	/* ======================================================================
	   Rendering
	   ====================================================================== */

	renderEvent(event, key) {
		return <Event key={key} details={event} filters={this.props.details.filters} />;
	}

	renderLoading() {
		return <div className="centered"><Spinner size="md" /></div>;
	}

	renderError() {
		return <div className="column-placeholder centered">{this.props.error}</div>;
	}

	renderContent() {
		if (this.props.events) {
			return this.props.events.map(this.renderEvent.bind(this));
		}
		else if (this.props.error) {
			return this.renderError();
		}
		else {
			return this.renderLoading();
		}
	}

	renderNewUpdatesButton() {
		let pillState = 'hidden';

		if (this.props.hasUpdates === 'appear') {
			pillState = 'zoomIn';
		} else if (this.props.hasUpdates === 'disappear') {
			pillState = 'zoomOut';
		}

		return (
			<div className={"update-pill Pill Pill--primary-inverted " + pillState}>
				<button onClick={this.handleNewUpdatesButton.bind(this)} className="Pill__label" type="button">
					<Icon name="arrow-up" className="update-pill-icon" /> New Updates
				</button>
			</div>
		)
	}

	render() {
		return (
			<section className="column">
				<div className="column-container">
					<header className="column-header">
						<h1 className="column-header-title one-line">
							<Icon name={getIcon(this.props.details.type)} />
							{this.props.details.payload}
						</h1>
						<a className="column-header-icon column-header-icon-first tooltipped tooltipped-s" onClick={this.props.toggleFilterModal.bind(this, this.props.index)} aria-label="Filter">
							<Icon name="settings" />
						</a>
						<a className="column-header-icon column-header-icon-second tooltipped tooltipped-s" onClick={this.props.removeColumn.bind(this, this.props.index)} aria-label="Remove">
							<Icon name="x" />
						</a>
						{this.renderNewUpdatesButton()}
					</header>
					<div ref="wrap" className="column-content" onScroll={this.handleScroll.bind(this)}>
						{this.renderContent()}
					</div>
				</div>
			</section>
		)
	}
}

export default Column;