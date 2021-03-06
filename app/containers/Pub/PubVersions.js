import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import Radium from 'radium';
import dateFormat from 'dateformat';
import { Dialog, Position, Menu, MenuDivider, Popover, PopoverInteractionKind } from '@blueprintjs/core';
import { putVersion, postDoi } from './actionsVersions';
import Loader from 'components/Loader/Loader';

let styles;

export const PubVersions = React.createClass({
	propTypes: {
		versionsData: PropTypes.array,
		pub: PropTypes.object,
		location: PropTypes.object,
		isLoading: PropTypes.bool,
		error: PropTypes.object,
		dispatch: PropTypes.func,
	},

	getInitialState: function() {
		return {
			confirmPublish: undefined,
			confirmRestricted: undefined,
			confirmDoi: undefined,
		};
	},

	componentWillReceiveProps(nextProps) {
		if (this.props.isLoading && !nextProps.isLoading && !nextProps.error) {
			this.setState({ 
				confirmPublish: undefined,
				confirmRestricted: undefined,
				confirmDoi: undefined,
			});	
		}
	},

	setRestricted: function(versionId) {
		this.setState({ confirmRestricted: versionId });
	},

	setPublish: function(versionId) {
		this.setState({ confirmPublish: versionId });
	},

	restrictVersion: function() {
		this.props.dispatch(putVersion(this.props.pub.id, this.state.confirmRestricted, null, true));
	},

	publishVersion: function() {
		this.props.dispatch(putVersion(this.props.pub.id, this.state.confirmPublish, true));
	},

	toggleDoiDialog: function(versionId) {
		this.setState({ confirmDoi: versionId });
	},

	createDoi: function() {
		this.props.dispatch(postDoi(this.props.pub.id, this.state.confirmDoi));
	},

	render: function() {
		const pub = this.props.pub || {};
		const location = this.props.location || {};
		const query = location.query || {};
		const isLoading = this.props.isLoading;
		const errorMessage = this.props.error;
		const versions = this.props.versionsData || [];
		const pubDOI = versions.reduce((previous, current)=> {
			if (current.doi) { return current.doi; }
			return previous;
		}, undefined);

		return (
			<div style={styles.container}>
				<h2>Versions</h2>

				{versions.sort((foo, bar)=> {
					// Sort so that most recent is first in array
					if (foo.createdAt > bar.createdAt) { return -1; }
					if (foo.createdAt < bar.createdAt) { return 1; }
					return 0;
				}).map((version, index, array)=> {
					const previousVersion = index < array.length - 1 ? array[index + 1] : {};
					let mode = 'private';
					if (version.isRestricted) { mode = 'restricted'; }
					if (version.isPublished) { mode = 'published'; }

					return (
						<div key={'version-' + version.id} style={styles.versionRow}>

							{this.props.pub.canEdit &&
								<div style={styles.smallColumn}>
									<Popover 
										content={
											<div>
												<Menu>
													<li className={'pt-menu-header'}><h6>Version is <span style={{ textTransform: 'capitalize' }}>{mode}</span></h6></li>
													{mode === 'private' &&
														<MenuDivider />
													}
													{mode === 'private' &&
														<li>
															<button type={'button'} className={'pt-menu-item'} onClick={this.setRestricted.bind(this, version.id)}>
																<p style={{ fontSize: '1.2em' }}>Set Restricted</p>
																<p>Restricted pubs can be read by journals and invited reviewers</p>
															</button>
														</li>
													}
													{(mode === 'private' || mode === 'restricted') &&
														<MenuDivider />
													}
													{(mode === 'private' || mode === 'restricted') &&
														<li>
															<button type={'button'} className={'pt-menu-item'} onClick={this.setPublish.bind(this, version.id)}>
																<p style={{fontSize: '1.2em'}}>Publish</p>
																<p>Make it publicly available</p>
															</button>
														</li>
													}
												</Menu>
											</div>
										}
										interactionKind={PopoverInteractionKind.HOVER}
										position={Position.BOTTOM_LEFT}>
										<span className={'pt-button pt-minimal'}>
											<span className={'pt-icon-standard pt-icon-globe'} style={mode === 'published' ? styles.icon : [styles.icon, styles.inactiveIcon]} />
											<span style={styles.iconSpacer} />
											<span className={'pt-icon-standard pt-icon-people'} style={mode === 'restricted' ? styles.icon : [styles.icon, styles.inactiveIcon]} />
											<span style={styles.iconSpacer} />
											<span className={'pt-icon-standard pt-icon-lock'} style={mode === 'private' ? styles.icon : [styles.icon, styles.inactiveIcon]} />
										</span>
									</Popover>

								</div>
							}
							
							<div style={styles.largeColumn}>
								{/* Link to Diff view */}
								<Link to={{ pathname: '/pub/' + this.props.pub.slug + '/diff', query: { ...query, version: undefined, base: previousVersion.hash, target: version.hash } }}>
									<h6 style={styles.noMargin}>{version.message || 'No message'}</h6>
								</Link>
								<p style={styles.noMargin}>{dateFormat(version.createdAt, 'mmm dd, yyyy HH:MM')}</p>
							</div>

							{this.props.pub.canEdit && mode === 'published' && !pubDOI &&
								<div style={[styles.smallColumn, { padding: '0.5em' }]}>
									<button className={'pt-button'} onClick={this.toggleDoiDialog.bind(this, version.id)}>Assign DOI</button>
								</div>
							}

							{version.doi &&
								<a href={'https://doi.org/' + pubDOI} style={[styles.smallColumn, { padding: '0.5em', display: 'block' }]}>
									<span href={'https://doi.org/' + pubDOI} className={'pt-tag'}>{version.doi}</span>
								</a>
							}

							<div style={styles.smallColumn}>
								{/* Link to pub at that version instance */}
								<Link to={{ pathname: '/pub/' + this.props.pub.slug, query: { ...query, version: version.hash } }}>	
									<button className={'pt-button p2-minimal'}>View Pub</button>
								</Link>
							</div>

							{!version.isPublished && !version.isRestricted &&
								<Dialog isOpen={this.state.confirmRestricted === version.id} onClose={this.setRestricted.bind(this, undefined)}>
									<div className="pt-dialog-body">
										<p>Please confirm that you want to set restricted access on this version. Once set, journal admins and invited reviewers will be granted read-acess to this version.</p>
										<p><b>Setting restricted access cannot be undone.</b></p>
										<div className={'pt-card pt-elevation-2'}>
											<h6 style={styles.noMargin}>{version.message || 'No message'}</h6>
											<p style={styles.noMargin}>{dateFormat(version.createdAt, 'mmm dd, yyyy HH:MM')}</p>
										</div>
									</div>
									<div className="pt-dialog-footer">
										<div className="pt-dialog-footer-actions">
											<div style={styles.loaderContainer}><Loader loading={isLoading} /></div>
											<div style={styles.loaderContainer}>{errorMessage}</div>
											<button type="button" className="pt-button" onClick={this.setRestricted.bind(this, undefined)}>Cancel</button>
											<button type="submit" className="pt-button pt-intent-primary" onClick={this.restrictVersion}>Enable Restricted Access</button>
										</div>
									</div>
								</Dialog>
							}

							{!version.isPublished &&
								<Dialog isOpen={this.state.confirmPublish === version.id} onClose={this.setPublish.bind(this, undefined)}>
									<div className="pt-dialog-body">
										<p>Please confirm that you want to publish the following version. Once published, the version will be publicly available.</p>
										<p><b>Publishing cannot be undone.</b></p>

										{!pub.isPublished &&
											<p><b>The Pub's URL (www.pubpub.org/pub/{pub.slug}) cannot be changed once published.</b></p>
										}
										<div className={'pt-card pt-elevation-2'}>
											<h6 style={styles.noMargin}>{version.message || 'No message'}</h6>
											<p style={styles.noMargin}>{dateFormat(version.createdAt, 'mmm dd, yyyy HH:MM')}</p>
										</div>
									</div>
									<div className="pt-dialog-footer">
										<div className="pt-dialog-footer-actions">
											<div style={styles.loaderContainer}><Loader loading={isLoading} /></div>
											<div style={styles.loaderContainer}>{errorMessage}</div>
											<button type="button" className="pt-button" onClick={this.setPublish.bind(this, undefined)}>Cancel</button>
											<button type="submit" className="pt-button pt-intent-primary" onClick={this.publishVersion}>Publish Version</button>
										</div>
									</div>
								</Dialog>
							}

							{!version.doi && version.isPublished &&
								<Dialog isOpen={this.state.confirmDoi === version.id} onClose={this.toggleDoiDialog.bind(this, undefined)}>
									<div className="pt-dialog-body">
										<p>Please confirm that you want to assign a DOI to this version of the pub.</p>
										<p><b>DOIs are permanent and can only be set on one version.</b></p>
										<div className={'pt-card pt-elevation-2'}>
											<h6 style={styles.noMargin}>{version.message || 'No message'}</h6>
											<p style={styles.noMargin}>{dateFormat(version.createdAt, 'mmm dd, yyyy HH:MM')}</p>
										</div>
									</div>
									<div className="pt-dialog-footer">
										<div className="pt-dialog-footer-actions">
											<div style={styles.loaderContainer}><Loader loading={isLoading} /></div>
											<div style={styles.loaderContainer}>{errorMessage}</div>
											<button type="button" className="pt-button" onClick={this.toggleDoiDialog.bind(this, undefined)}>Cancel</button>
											<button type="submit" className="pt-button pt-intent-primary" onClick={this.createDoi}>Assign DOI</button>
										</div>
									</div>
								</Dialog>
							}
							
						</div>
					);
				})}

			</div>
		);
	}
});

export default Radium(PubVersions);

styles = {
	container: {
		
	},
	noMargin: {
		margin: 0,
	},
	versionRow: {
		display: 'table',
		width: '100%',
		margin: '1em 0em 0em',
		padding: '1em 0em 0em',
		borderTop: '1px solid #CCC',
		verticalAlign: 'middle',
	},
	smallColumn: {
		display: 'table-cell',
		width: '1%',
		whiteSpace: 'nowrap',
		verticalAlign: 'middle',
	}, 
	largeColumn: {
		display: 'table-cell',
		width: '100%',
		padding: '0em 1em',
		verticalAlign: 'middle',
	},
	inactiveIcon: {
		opacity: '.25',
	},
	icon: {
		margin: 0,
		lineHeight: 'inherit',
	},
	iconSpacer: { 
		width: '0.5em', 
		height: '1em', 
		display: 'inline-block',
	},
	noClick: {
		pointerEvents: 'none',
	},
	loaderContainer: {
		display: 'inline-block',
		margin: 'auto 0',
	},
};
