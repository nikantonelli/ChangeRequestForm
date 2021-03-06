Ext.define('Rally.technicalservices.BooleanFieldComboBox',{
    extend: 'Rally.ui.combobox.FieldComboBox',
    alias: 'widget.tsbooleanfieldcombobox',

    _isNotHidden: function(field) {
        return (!field.hidden && field.attributeDefinition && field.attributeDefinition.AttributeType == 'BOOLEAN');
    }
});

Ext.define('Rally.technicalservices.settings.FormConfiguration',{
    extend: 'Ext.form.field.Base',
    alias: 'widget.tsformconfigsettings',
    logger: new Rally.technicalservices.Logger(),
    config: {
        value: undefined,
        fields: undefined,
        decodedValue: {}
    },

    fieldSubTpl: '<div id="{id}" class="settings-grid"></div>',
    noDefaultValue: ['Attachments'],

    width: '100%',
    cls: 'column-settings',

    onDestroy: function() {
        if (this._grid) {
            this._grid.destroy();
            delete this._grid;
        }
        this.callParent(arguments);
    },

//    saveFieldSettings: function(a, b) {
//
//        if (this.hasOwnProperty('_store')) {
//            //this.logger.log('saveFieldSettings', this.value, this._store.data.items)
//
//            var form = this;
//            var order = 1;
//            var newFieldList = _.map(this._store.data.items, function(record) {
//                //reorder the store
//                record.order = order++;
//                //Find the records in the field list
//                return _.find(form.fields, { 'name': record.get('fieldName')});
//            });
//            this.config.fields = newFieldList;
//            this.fields = newFieldList;
//            //this.logger.log('saveFieldSettings out', this.fields);
//
//
//            this._store.filter();   //Fire re-sort
//        }
//    },

    onRender: function() {

    //this.logger.log('onRender in', this.value);

        var decodedValue = {};
        if (this.value && !_.isEmpty(this.value)){
            decodedValue = Ext.JSON.decode(this.value);
        }
        this.callParent(arguments);

        var data = [];
        var formData = [];

        _.each(this.fields, function(f){
                data.push({order: f.order, fieldName: f.fieldName, displayName: f.displayName, display: f.display, defaultValue: f.defaultValue, required: f.required });
        }, this);

        this._store = Ext.create('Ext.data.Store', {
            fields: ['order', 'fieldName', 'displayName', 'display', 'defaultValue','required','fieldObj'],
            data: data,
            sortOnFilter: false,
            sortOnLoad: true,
            sorters: [{
                property: 'order',
                value: 'ASC'
            }]
        });

        //this.logger.log('formConfigSetting', this._store);
        this._grid = Ext.create('Rally.ui.grid.Grid', {
            autoWidth: true,
            renderTo: this.inputEl,
            columnCfgs: this._getColumnCfgs(),
            showPagingToolbar: false,
            showRowActionsColumn: false,
            store: this._store,
            height: 400,
            width: this.getWidth() * 0.90,
            editingConfig: {
                publishMessages: false
            },
            viewConfig: {
                plugins: {
                    ptype: 'gridviewdragdrop',
                    dragText: 'Drag and drop to reorder'
                }
//                },
//                listeners: {
//                    scope: this,
//                    drop: this.saveFieldSettings
//                }
            }
        });
      //  this.fireEvent('ready');
    },

    _getColumnCfgs: function() {
        var me = this;

        var columns = [
            {
                text: 'Field',
                dataIndex: 'displayName',
                flex: 1
            },
            {
                text: 'Show',
                dataIndex: 'display',
                renderer: function (value) {
                    return value === true ? 'Yes' : 'No';
                },
                editor: {
                    xtype: 'rallycombobox',
                    displayField: 'name',
                    valueField: 'value',
                    editable: false,
                    storeType: 'Ext.data.Store',
                    storeConfig: {
                        remoteFilter: false,
                        fields: ['name', 'value'],
                        data: [
                            {'name': 'Yes', 'value': true},
                            {'name': 'No', 'value': false}
                        ]
                    }
                }
            },
            {
                text: 'Required',
                dataIndex: 'required',
                renderer: function (value) {
                    return value === true ? 'Yes' : 'No';
                },
                editor: {
                    xtype: 'rallycombobox',
                    displayField: 'name',
                    valueField: 'value',
                    editable: false,
                    storeType: 'Ext.data.Store',
                    storeConfig: {
                        remoteFilter: false,
                        fields: ['name', 'value'],
                        data: [
                            {'name': 'Yes', 'value': true},
                            {'name': 'No', 'value': false}
                        ]
                    }
                }
            }, {
                text: 'Default Value',
                flex: 3,
                xtype: 'actioncolumn',
                sortable: false,
                menuDisabled: true,
                renderer: function(v,m,r){
                    var val= '<i>Default Values not Supported</i>',
                        color = "gray";
                    if (me._isAllowedDefaultValue(r)) {
                        val = r.get('defaultValue') || '';
                        color = "black";
                    }
                    return Ext.String.format('<span style="display: inline; font-size: 11px; padding-left:50px;line-height:15px;color:{0};">{1}</span>',color,val);


                },
                items: [{
                    //iconCls: "picto icon-edit",
                    icon: '/slm/images/icon_edit_view.gif',
                    tooltip: 'Edit',
                    handler: function (grid, rowIndex, colIndex) {
                        var rec = grid.getStore().getAt(rowIndex);
                        me.showEditor(rec);
                    },
                    isDisabled: function(grid, row, col, item, record){
                        return !me._isAllowedDefaultValue(record);
                    }
                }, {
                    icon:  '/slm/images/icon_delete.gif',
                    tooltip: 'Delete',
                    handler: function (grid, rowIndex, colIndex) {
                        var rec = grid.getStore().getAt(rowIndex);
                        rec.set('defaultValue', null);
                    },
                    isDisabled: function(grid, row, col, item, record){
                        return !me._isAllowedDefaultValue(record);
                    }
                }]
            }

        ];
        return columns;
    },
    _isAllowedDefaultValue: function(record){

        var noDefaultValue = ['Attachments'];
        if (Ext.Array.contains(noDefaultValue, record.get('fieldName'))){
            return false;
        }
        return true;
    },
    showEditor: function(record){
        Ext.create('Rally.technicalservices.DynamicCellEditor',{
            record: record,
            context: Rally.getApp().getContext()
        });
    },
    /**
     * When a form asks for the data this field represents,
     * give it the name of this field and the ref of the selected project (or an empty string).
     * Used when persisting the value of this field.
     * @return {Object}
     */
    getSubmitData: function() {
        var data = {};

        data[this.name] = Ext.JSON.encode(this._buildSettingValue());
    //this.logger.log('getSubmitData out', data);
        return data;
    },
    _buildSettingValue: function() {
        var mappings = {};

        var order = 0;
        this._store.each(function(record) {
                mappings[record.get('fieldName')] = {
                    display: record.get('display'),
                    displayName: record.get('displayName'),
                    fieldName: record.get('fieldName'),
                    defaultValue: record.get('defaultValue'),
                    required: record.get('required'),
                    order: order++
                };
        }, this);
        //this.logger.log('_buildSettingValue out', mappings);
        return mappings;
    },

    getErrors: function() {
        var errors = [];
        if (_.isEmpty(this._buildSettingValue())) {
           errors.push('At least one field must be shown.');
        }
        return errors;
    },
    validate : function() {
        var me = this,
            isValid = me.isValid();
        if (isValid !== me.wasValid) {
            me.wasValid = isValid;
            me.fireEvent('validitychange', me, isValid);
        }
        if (!isValid){
            var html = this.getErrors().join('<br/>');
            Ext.create('Rally.ui.tooltip.ToolTip', {
                target : this.getEl(),
                html: '<div class="tsinvalid">' + html + '</div>',
                autoShow: true,
                anchor: 'bottom',
                destroyAfterHide: true
            });

        }

        return isValid;
    },
    setValue: function(value) {
        this.callParent(arguments);
        this._value = value;
    }
});
