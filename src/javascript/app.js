Ext.define("defect-submit-form", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            approvalField: false,
            enableFormattedID: false,
            submitDirectory: ''
        }
    },
    layoutConfig: '{"fields" : [' +
//        '{ "Name" : "Project",    "view" : true,  "edit" : false },' +
//        '{ "Name" : "Parent",    "view" : true,  "edit" : false },' +
        '{ "Name" : "Ready",                    "view" : false,  "edit" : true                   , "defaultValue" : false,           "altName" : "Ready to Submit"      },' +
        '{ "Name" : "c_BPSProductComponent",    "view" : true,   "edit" : true, "required" : true,                                   "altName" : "Product/Component"    },' +
        '{ "Name" : "Name",                     "view" : true,   "edit" : true, "required" : true },' +
        '{ "Name" : "Description",              "view" : false,  "edit" : true, "required" : true },' +
        '{ "Name" : "Priority",                 "view" : true,   "edit" : true, "required" : true, "defaultValue" : "Normal"         },' +
        '{ "Name" : "Severity",                 "view" : true,   "edit" : true,                    "defaultValue" : "Minor Problem"  },' +
        '{ "Name" : "State",                    "view" : true,   "edit" : true,                    "defaultValue" : "Submitted"      },' +
        '{ "Name" : "ScheduleState",            "view" : true,   "edit" : true,                    "defaultValue" : "Backlog"        },' +
        '{ "Name" : "SubmittedBy",              "view" : true,   "edit" : true },' +
        '{ "Name" : "Owner",                    "view" : true,   "edit" : false},' +
        '{ "Name" : "c_BPSCodeReview",          "view" : true,   "edit" : true, "required" : true,                                   "altName" : "Code Review"          },' +
        '{ "Name" : "c_BPSSecurityCodeReview",  "view" : true,   "edit" : true, "required" : true,                                   "altName" : "Security Review"      },' +
        '{ "Name" : "c_BPSDatabaseReview",      "view" : true,   "edit" : true, "required" : true,                                   "altName" : "Database Review"      },' +
        '{ "Name" : "c_BPSUsermanualupdatereqd","view" : true,   "edit" : true, "required" : true,                                   "altName" : "User Manual Update"   },' +
        '{ "Name" : "FoundInBuild",             "view" : true,   "edit" : true,                                                      "altName" : "Identified in Build#" },' +
        '{ "Name" : "Environment",              "view" : true,   "edit" : true } ' +
        ']}',
    formModel: undefined,
    //TODO Need to load these from the subscription
    formModelName: 'Defect',
    parentModelName: 'Requirement',
    items: [],
    notAllowedFields: [
            //User story fields
            'ScheduleState','PortfolioItem',
            //Portfolio Item fields
            'State','Children',
            //Common fields
            'Parent','PredecessorsAndSuccessors','Predecessors','Successors','Project','Milestones','Workspace','Tags','Changesets','DisplayColor'
    ],
    externalAppSettingsKey: 'niksAppSettings',
    launch: function() {
        if (this.isExternal()){
            this.getExternalAppSettings(this.externalAppSettingsKey);
        } else {
            this.onSettingsUpdate(this.getSettings());
        }
    },
    _prepareApp: function(){
//        console.log('_prepareApp', this.formModelName, this.formConfiguration);
        Rally.technicalservices.WsapiToolbox.fetchModel(this.formModelName).then({
            scope: this,
            success: function(model){
                this.formModel = model;
                this.model = model;
                this._showGrid(model);
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });
    },
    _buildForm: function(model, form_config, record){
        //this.logger.log('_buildForm');
        this._clearWindow();
        this.add({xtype:'container',itemId:'button_box', flex: 1, layout: {type: 'hbox', pack: 'center'}});
        this.add({xtype:'container',itemId:'display_box', flex: 1});
        this.down('#display_box').add({
            xtype: 'tsrequestform',
            itemId: 'requestform',
            model: model,
            record: record,
            instructions: this.formInstructions,
            formConfiguration: form_config,
            submitDirectory: this.submitDirectory,  //If ready is set, push the record to here
            listeners: {
                scope: this,
                save: this._onSaved,
                onwarning: this._onWarning,
                onerror: this._onError,
                ready: this._onReady
            }
        });
        var btnText = 'Submit';
        if (record !== undefined) {
            btnText = 'Update';
        }
        this.down('#button_box').add({
            xtype:'rallybutton',
            text: btnText,
            itemId: 'btn-submit',
            style: {
                textAlign: 'center'
            },
            width: 75,
            scope: this,
            handler: this._save
        });
        this.down('#button_box').add({
            xtype:'rallybutton',
            text: 'Cancel',
            itemId: 'btn-cancel',
            style: {
                textAlign: 'center'
            },
            width: 75,
            scope: this,
            handler: this._cancel
        });
    },
    _save: function(){
        var requestForm = this.down('#requestform');
//        if (requestForm.validate()) {
            requestForm.save();
//        } else {
//            Rally.ui.notify.Notifier.showError({message: 'Check data entry before submission'});
//        }
    },
    _onSaved: function(newRecord){
        //this.logger.log('_onSaved',newRecord);
        Rally.ui.notify.Notifier.showCreate({artifact: newRecord});
        this._showGrid(this.model);
    },
    _cancel: function(){
        this._showGrid(this.model);
    },
    _onWarning: function(obj){
        Rally.ui.notify.Notifier.showWarning(obj);
    },
    _onError: function(obj){
        Rally.ui.notify.Notifier.showError(obj);
    },
    _onReady: function(form){
        //this.logger.log('_onReady', form);
        form.doLayout();
        form.setWidth('95%')
        this.down('#display_box').doLayout();
    },
    _clearWindow: function(){
        if (this.down('#story-grid')){
            this.down('#story-grid').destroy();
        }
        if (this.down('#display_box')){
            this.down('#display_box').destroy();
        }
        if (this.down('#button_box')){
            this.down('#button_box').destroy();
        }
        if (this.down('#new_button')){
            this.down('#new_button').destroy();
        }
    },
    _checkSubmit: function(store,record,action,field) {
        //Don't need:  && (record.get('Ready') !== record.raw.Ready)
        if (field.includes('Ready') && (action === 'edit') && (record.raw.Ready !== false)) {
            if ( this.submitDirectory ) {
                record.set('Project', this.submitDirectory);
                this.fireEvent('update');
            }
        }
    },
    _showGrid: function(model) {
        this._clearWindow();
        var btn = Ext.create('Ext.Container', {
                    itemId: 'new_button',
                    items: [{
                        xtype: 'rallybutton',
                        text: 'New Defect',
                        margin: 5,
                        bubbleEvents: ['click']
                    }]
                });
        this.add(btn);
        btn.on({
                    click: this._onNewRequest,
                    scope: this
                });
        var context = this.getContext();
        var ds = Ext.create('Rally.data.wsapi.Store', {
            model: model,
            autoLoad: false,
            fetch: true,
            filters: [{
                property: 'ScheduleState.Name',
                operator: '!=',
                value: 'Accepted'
            }],
            sorters: [
                {
                    property: 'CreationDate',
                    direction: 'DESC'
                }
            ],
            //When data changes, check ready flag to see if it needs moving to submitDirectory
            listeners: {
                update: this._checkSubmit,
                scope: this
            }
        }, this);
        ds.load().then({
            scope: this,
            failure: function(a,b,c,d,e){
                this.logger.log('Could not load datastore');
                debugger;
            },
            success: function(){
                var gb = this.add({
                    xtype: 'rallygrid',
                    context: context,
                    itemId: 'story-grid',
                    model: model,
                    stateful: false,
                    store: ds,
                    showRowActionsColumn: false,
                    columnCfgs: this.getColumnCfgs(),
                    height: this.getHeight()
                });
            },
            scope: this
        });
    },
    getColumnCfgs: function(){
        var app = this;
        config_obj = Ext.JSON.decode(this.layoutConfig);
        // I am sure there are better ways to do this, but it works....
        var fieldList = [];
        for ( key in config_obj.fields) {
            if (config_obj.fields[key].view) {
                if ( config_obj.fields[key].Name === 'Requirement'){
                    fieldList.push({
                        dataIndex: 'Requirement',
                        text: 'User Story',
                        renderer: function( field, cell, record, row, column, view) {
                            var nclass = ' class=applink';
                            var name =  '<-- Click to Set -->';
                            if ( record.data.Parent ) {
                                name =  record.data.Requirement._refObjectName;
                            }
                            else {
                                nclass = ' class=errorbar';
                            }
                            return '<div' + nclass +  '>' +  name + '</div>';
                        },
                        listeners: {
                            click: function(view,cellObject,row,column,event,record,rowObject) {
                                Ext.create('Rally.ui.dialog.ArtifactChooserDialog', {
                                    artifactTypes: [ 'UserStory' ],
                                    autoShow: true,
                                    title: 'Choose an associated work item ',
                                    listeners : {
                                        artifactchosen: function (dialog, selectedRecord) {
                                            record.set('Requirement', selectedRecord.get('_ref'));
                                            record.save().then({
                                                success: function(a,b,c,d,e,f,g) {
                                                    Rally.ui.notify.Notifier.show({ message: 'Item: ' + record.get('FormattedID') + ' updated'});
                                                },
                                                failure: function (error) {
                                                    Rally.ui.notify.Notifier.showError({ message: 'Failed to save item: ' + record.get('FormattedID') });
                                                }
                                            })
                                        }
                                    }
                                });
                            }
                        }
                    });
                } else {
                    fieldList.push(config_obj.fields[key].Name);
                }
            }
        }
        //this.logger.log('gridColumnCfgObj', fieldList);
        var clmns = [];
        if ( !this.getSetting('enableFormattedID')) {
            clmns.push({
                dataIndex: 'FormattedID',
                text: 'ID',
                renderer: function(item, row, record, arg4, arg5) {
                    var tpl = new Ext.XTemplate(
                        '<tpl for=".">',
                        '<span class="icon-eye-open">',
                        '</span>',
                        '<span class="applink" id={[this._getLinkId(values)]}>',
                        '{[this._getPopUp()]}',
                        '</span>',
                        '</tpl>',
                        {
                            _getLinkId: function(x,y,z) {
                                var result = Ext.id();
                                Ext.Function.defer( this.addListener,10, this, [result]);
                                return result;
                            },
                            _getPopUp: function(w,x,y,z) {
                                return item;
                            },
                            addListener: function(id) {
                                var config_obj = Ext.JSON.decode(app.layoutConfig);
                                Ext.get(id).on('click', function() { app._buildForm(app.model, config_obj.fields, record);});
                            }
                        });
                    return tpl.apply(record)
                }
            });
        }
        else {
            clmns.push('FormattedID');
        }
        if ( this.getSetting('approvalField')) {
            clmns.push({
                dataIndex: 'Project',
                text: 'Category',
                renderer: function(item){
                    return item._refObjectName;
                }
            });
        }
        clmns = clmns.concat(fieldList);
        //this.logger.log('gridColumnCfgs', clmns);
        return clmns;
    },
    _onNewRequest: function() {
        //this.logger.log('_onNewRequest');
         var config_obj = Ext.JSON.decode(this.layoutConfig);
        this._buildForm(this.model, config_obj.fields);
    },
    getOptions: function() {
        return [
            {
                text: 'About...',
                handler: this._launchInfo,
                scope: this
            }
        ];
    },
    _isFieldAllowed: function(field){
        var forbiddenTypes = ['WEB_LINK'];
        if (Ext.Array.contains(this.notAllowedFields, field.name)){
            return false;
        }
        if (field.readOnly === true || field.hidden === true){
            return false;
        }
        if (field && !field.attributeDefinition){
            return false;
        }
        //Not showing Weblinks for now
        if (Ext.Array.contains(forbiddenTypes, field.attributeDefinition.AttributeType)){
            return false;
        }
        return true;
    },
    getSettingsFields: function() {
        var returned = [
        {
            name: 'enableFormattedID',
            xtype: 'rallycheckboxfield',
            fieldLabel: 'Show ID as hyperlink',
            labelAlign: 'top'
        },
        {
            name: 'submitDirectory',
            xtype: 'rallyprojectpicker',
            labelAlign: 'top',
            fieldLabel: 'Target "submit on ready" project'
        }];
        return returned;
    },
    _launchInfo: function() {
        if ( this.about_dialog ) { this.about_dialog.destroy(); }
        this.about_dialog = Ext.create('Rally.technicalservices.InfoLink',{});
    },
    isExternal: function(){
        return typeof(this.getAppId()) == 'undefined';
    },
    //onSettingsUpdate:  Override
    onSettingsUpdate: function (settings){
        //this.logger.log('onSettingsUpdate',settings);
        Ext.apply(this, settings);
        if (this.isExternal()){
            this.saveExternalAppSettings(this.externalAppSettingsKey, settings);
        } else {
            this.saveInternalAppSettings();
        }
        this._prepareApp();
    },
    saveExternalAppSettings: function(key, settings){
        var prefs = {};
        _.each(settings, function(val, setting_key){
            var pref_key = key + '.' + setting_key;
            prefs[pref_key] = val;
        });
        //this.logger.log('SaveExternalAppSettings', key, settings, prefs);
        Rally.data.PreferenceManager.update({
            project: this.getContext().getProject()._ref,
            settings: prefs,
            scope: this,
            success: function(updatedRecords, notUpdatedRecords) {
                //this.logger.log('settings saved', key, updatedRecords, notUpdatedRecords);
            }
        });
    },
    saveInternalAppSettings: function() {
        this.setSettings();
    },
    getExternalAppSettings: function(key){
        Rally.data.PreferenceManager.load({
            project: this.getContext().getProject()._ref,
            additionalFilters: [{
                property: 'name',
                operator: 'contains',
                value: key
            }],
            scope: this,
            cache: false,
            success: function(prefs) {
                _.each(prefs, function(val, pref_name){
                    if (/\.formConfiguration$/.test(pref_name)){
                        this.formConfiguration = val;
                    }
                }, this);
                this._prepareApp();
            },
            failure: function(error) {
                this.logger.log('Could not load settings');
                debugger;
            }
        });
    },
    getInternalAppSettings: function() {
    },
});
