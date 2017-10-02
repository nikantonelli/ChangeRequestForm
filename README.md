#Defect Submission Form

This app will provide a list of the defects and allow them to enter new ones using a 
predefined form layout. Usually the user does not need to see or be able to modify all the
fields that are held for an artifact. To make deployment simple, the project admin will need to set up
a set of fields to view and edit (within the source code). There is a self-explanatory table in the code 
called "layoutConfig" that can be set to requirements

The app controls the created defect in one of two ways:

1. It leaves it in the creator's current project node until you have entered all the fields as you have 
   discovered the info. The advantage of this is that you can fiddle about with a defect artefact in your 
   own local space and then when you are sure that it is acceptable to the relevant team/dept, you can 
   move it into their node with a simple update.

OR

2. It moves it to a target directory that could be somewhere completely different. This would 
   make it appear as if the defect had 'disappeared' into someone elses inbox

You can use the "Ready" field to indicate that the defect has just been moved into the target location. 
This can act as a flag to the recipients that it is "new" and requires action.

The layoutConfig table can enable a couple of extra features:

1. Even though the Agile Central may be set that the field is not mandatory, by setting a 'required' 
   flag in the layoutConfig table, the app will not create the entry unless all those fields are set to 
   something apart from 'blank' (Mandatory fields are not really that helpful, try not to use them if at 
   all possible).
2. The field name can be "translated" to something more meaningful in the entry form by adding an "altName" field

In the App settings, you can also override the use of the ready field so that it _always_ moves the defect to the target directory
if it has been set.
