# Simple FTP Cache Action

Allows you to treat a FTP Server as caching server.

- Upload a folder or a archive (tar.gz)
- Download a folder or a archive (tar.gz)
- Clean afterwards if needed.

## Inputs

```yml
  type:
    description: 'FTP or SFTP'
    required: true
    default: "FTP"
  host:
    description: 'Host'
    required: true
  mode:
    description: 'Upload,Download,Remove'
    default: true
    required: "Upload"
  user:
    description: 'User'
    required: true
  password:
    description: 'Password'
    required: true
  source:
    description: 'Source Folder'
    required: true
  destination:
    description: 'Destination Folder'
  secure:
    description: 'Is Connection Secure? (Only relevant for FTP)'
    required: false
    default: true
  timeout:
    description: 'timeout Folder'
    required: false
    default: 30000
  archive-name:
    description: 'Cache Name. Needed if archive = true'
    required: false
  archive:
    description: 'Creates a tar archive for the given folder and uploads/downloads that'
    required: false
    default: true
````
