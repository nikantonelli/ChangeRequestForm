#Change Request Form

To make it easier for non-technical users to submit Change Requests to a centralised team.

This app will provide a list of the users requests and allow them to enter new ones using a 
predefined form layout. Usually the user does not need to see or be able to modify all the
fields that are held for an artifact, so the App Settings allow the project admin to set up
a set of fields to view and edit.

The app controls the created artifact in two ways:

1. It leaves in in the current project node until moved by the intended recipient. The 
   advantage of this is that you can create a sub node to the current node that the recipient 
   also has read/write access, but general users have read only. In this way the user can still 
   see all the artefacts, but now ownership/control is passed to the recipient
   
2. It moves it to a target directory that could be somewhere completely different. This would 
   make it appear as if the change request had 'disappeared' into someone elses inbox
   
Using the project hierarchy in a clever way could result in the user being able to see the stage
of deliberation of the request. For example, if you make sub-nodes called "Under Consideration", 
"Accepted" and "Rejected", the user could get feedback as to what the recipient is doing with 
the request. At the same time, the artefact could have it's usual "State" field or a custom field 
defining another workflow that the recipient uses, but doesn't want visible to the user