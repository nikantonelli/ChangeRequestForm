Ext.define("configurable-request-form", {
    extend: 'Rally.app.App',
    componentCls: 'app',
    logger: new Rally.technicalservices.Logger(),
    defaults: { margin: 10 },
    config: {
        defaultSettings: {
            formConfigurationSettings: {},
            formInstructions: '',
            approvalField: false,
            enableFormattedID: false,
            submitDirectory: ''
        }
    },
    formModel: undefined,
    formModelName: 'PortfolioItem/Feature',
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
        //this.logger.log('_prepareApp', this.formModelName, this.formInstructions, this.formConfigurationSettings);
        Rally.technicalservices.WsapiToolbox.fetchModel(this.formModelName).then({
            scope: this,
            success: function(model){
                this.formModel = model;
                this._validateSettings(model);
            },
            failure: function(msg){
                Rally.ui.notify.Notifier.showError({message: msg});
            }
        });
    },
    _validateSettings: function(model){
        //this.logger.log('_validateSettings');
        var config_obj = this.formConfiguration;
        if (!Ext.isObject(config_obj)){
            var formSettings = this.getSetting('formConfigurationSettings');
            if (!Ext.isObject(formSettings)){
                config_obj = Ext.JSON.decode(formSettings);
            }
        }

        //this.logger.log('_validateSettings formFieldConfig', config_obj);
        if (_.isEmpty(config_obj)){
            this.add({
                xtype: 'container',
                itemId: 'display_box',
                flex: 1,
                html: 'No form configuration has been defined.<br/>Please use the App Settings to configure the form.',
                style: {
                    fontFamily: 'ProximaNovaLight, Helvetica, Arial'
                }
            });
        } else {
            this.formConfiguration = config_obj;
            this.model = model;
            this._showGrid(model);
        }
    },
    _buildForm: function(model, form_config){
        //this.logger.log('_buildForm');

        this._clearWindow();

        this.add({xtype:'container',itemId:'display_box', flex: 1});
        this.add({xtype:'container',itemId:'button_box', flex: 1, layout: {type: 'hbox', pack: 'center'}});

        this.down('#display_box').add({
            xtype: 'tsrequestform',
            itemId: 'requestform',
            model: model,
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
        this.down('#button_box').add({
            xtype:'rallybutton',
            text: 'Submit',
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
        requestForm.save();
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
        if (field.includes('Ready') && (action === 'edit') && (record.raw.Ready === false)) {
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
                        text: 'New Request',
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
                property: 'State.Name',
                operator: '!=',
                value: 'Done'
            },
            {
                property: 'Owner',
                value: context.getUser().UserName
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
                //this.logger.log('Could not load datastore');
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

        if (this.isExternal()) {
			config_obj = Ext.JSON.decode(this.formConfigurationSettings);
        }
        else {
            config_obj = Ext.JSON.decode(this.getSetting('formConfigurationSettings'));
        }

        // I am sure there are better ways to do this, but it works....
        var fieldList = {};
        for ( key in config_obj) {
            if (config_obj[key].display) {
                fieldList[key] = config_obj[key];
            }
        }

        //this.logger.log('gridColumnCfgObj', fieldList);

        var clmns = [];

        if ( this.getSetting('enableFormattedID')) {
            clmns = ['FormattedID']
        }
        else {

            clmns =  [{
                dataIndex: 'FormattedID',
                text: 'ID',
                renderer: function(item){
                    return item;
                }
            }];
        }
        if ( this.getSetting('approvalField')) {
            clmns.push({
                dataIndex: 'Project',
                text: 'Approval Stage',
                renderer: function(item){
                    return item._refObjectName;
                }
            });
        }
        clmns = clmns.concat(Ext.Object.getKeys(fieldList));

        //this.logger.log('gridColumnCfgs', clmns);
        return clmns;
    },

    _onNewRequest: function() {
        //this.logger.log('_onNewRequest');
        this._buildForm(this.model, this.formConfiguration)
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
        var formModel = this.formModel;
        var fields = {};
        var configJSON = {};

        if (this.isExternal()){
			configJSON = this.formConfigurationSettings;
        }
        else {
            configJSON = this.getSetting('formConfigurationSettings');
        }

        if ( !_.isEmpty(configJSON)) {
            //this.logger.log('found settings', configJSON);
            fields = Ext.JSON.decode( configJSON );
        } else {
            if (formModel){
                modelFields = formModel.getFields();
                var order = 1;

                _.each(modelFields, function(f){
                    if (this._isFieldAllowed(f)){
                        var dsp = f.required || false,
                            def_value = f.defaultValue || '',
                            req = f.required || false;

                        fields[f.name] = { displayName: f.displayName, fieldName: f.name, display: dsp, defaultValue: def_value, required: req, order: order++};
                    }
                }, this);
            //this.logger.log('loaded new settings', fields);
            }
        }

        var returned = [{
            name: 'formInstructions',
            xtype: 'textareafield',
            fieldLabel: 'Form Instructions',
            labelAlign: 'top',
            autoShow: true,
            width: '100%',
            margin: 15,
            height: 100
        },{
            name: 'formConfigurationSettings',
            xtype: 'tsformconfigsettings',
            fieldLabel: 'Drag rows to specify order on the form. Remember to "leave" the field for it to store!',
            margin: 15,
            labelAlign: 'top',
            fields: fields
        },
        {
            name: 'enableFormattedID',
            xtype: 'rallycheckboxfield',
            fieldLabel: 'Show ID as hyperlink',
            labelAlign: 'top'
        },
        {
            name: 'approvalField',
            xtype: 'rallycheckboxfield',
            fieldLabel: 'Show project node as approval stage',
            labelAlign: 'top'
        },
        {
            name: 'submitDirectory',
            xtype: 'rallyprojectscopefield',
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
            this.formConfiguration = Ext.JSON.decode(settings.formConfigurationSettings);
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
                //this.logger.log('settings loaded', key, prefs);
                _.each(prefs, function(val, pref_name){
                    if (/\.formInstructions$/.test(pref_name)){
                        this.formInstructions = val;
                    }
                    if (/\.formConfigurationSettings$/.test(pref_name)){
                        if (val && !_.isEmpty(val)){
                            this.formConfigurationSettings = val;
                        }
                    }
                }, this);

                this.formConfiguration = Ext.JSON.decode(this.formConfigurationSettings);
                this._prepareApp();
            }
        });
    },

    getInternalAppSettings: function() {
        //this.logger.log('getInternalAppSettings', this.getSettings());
        this.formConfiguration = Ext.JSON.decode(this.formConfigurationSettings);
    },

    saveInternalAppSettings: function() {
        //this.logger.log('saveInternalAppSettings', this.getSettings());
        this.setSettings();
//        this.formConfiguration = Ext.JSON.decode(this.getSetting('formConfigurationSettings'));
    }
});
