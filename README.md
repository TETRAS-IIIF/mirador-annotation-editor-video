# Mirador Annotation Editor Video - GPL edition

[Online demos](https://tetras-iiif.github.io/mirador-annotation-editor-video/)
- [Roadmap](https://github.com/TETRAS-IIIF/.github/blob/main/profile/ROADMAP.md)

## Presentation

### Generalities

`mirador-annotation-editor-video`(also known as "MAEV") is a [Mirador 4](https://github.com/projectmirador/mirador)
plugin that adds annotation creation tools to the user interface. It support both image and video annotation.

It's based on [Mirador Annotation Editor](https://github.com/TETRAS-IIIF/mirador-annotation-editor) (Himself based on the original [mirador-annotation](https://github.com/ProjectMirador/mirador-annotations/). We add create/update annotation on video support and other template. 

This plugin is intended to be run with our [mirador video](https://github.com/TETRAS-IIIF/mirador-video/). 
If you want to run classic Mirador 4, see our other plugin [Mirador Annotation Editor](https://github.com/TETRAS-IIIF/mirador-annotation-editor)

### General functionalities

- Activate a panel with tools to create annotations on IIIF documents (manifests) containing images **and videos with 
MAEV**
- Spatial and temporal targets for annotations
- Overlay annotations (geometric forms, free hand drawing, text and images)
- Textual/semantic annotations and tags
- Annotation metadata (based on Dublin Core)
- Annotation with another manifest --> network of IIIF documents

<!-- TOC -->
* [Mirador Annotation Editor Video - GPL edition](#mirador-annotation-editor-video---gpl-edition)
  * [Presentation](#presentation)
    * [Generalities](#generalities)
    * [General functionalities](#general-functionalities)
  * [Install / integrate](#install--integrate-)
    * [NPM package](#npm-package)
    * [Use in existing npm project with previous plugins](#use-in-existing-npm-project-with-previous-plugins)
    * [Install (local)](#install-local)
  * [Usage](#usage)
    * [Persisting Annotations](#persisting-annotations)
    * [Configuration](#configuration-)
  * [Technical aspects from the original plugin](#technical-aspects-from-the-original-plugin)
  * [Contribute](#contribute)
    * [Contributor](#contributor)
    * [License](#license)
      * [Property](#property)
<!-- TOC -->

## Install / integrate 

### NPM package

```bash
npm install mirador-annotation-editor-video
```

### Use in existing npm project with previous plugins

You can override existing annotation plugin with your own versions by using npm. We support React 18 and MUI 5.

Update your `package.json` file to include the following dependencies and devDependencies:

```js
"mirador-annotations":"npm:mirador-annotation-editor-video@^1.2.12",
```

You need also to use the custom version of Mirador 4.

```json
"mirador" : "npm@mirador-video@^1.2.12",
```

[Mirador 4 integration example](https://github.com/ProjectMirador/mirador-integration)

MAE and MAEV share the same build and integration system.


### Install (local)

This method requires `nvm`, `npm`.

```
git clone git@github.com:TETRAS-IIIF/mirador-annotation-editor-video.git
cd mirador-annotation-editor-video
nvm use
npm install
```

Run a demo with Mirador and the MAE plugin :

```
npm start
```

## Usage

### Persisting Annotations
Persisting annotations requires implementing a IIIF annotation server. Several 
[examples of annotation servers](https://github.com/IIIF/awesome-iiif#annotation-servers) are available on iiif-awesome.

We provide a full Mirador workspace with persistance at https://app.mirador-multi-user.com.

### Configuration 

See `demo/src/index.js` for a full configuration sample.

```js
 let annotationConfig = { // Annotation plugin related
    adapter: (canvasId) => new LocalStorageAdapter(`localStorage://?canvasId=${canvasId}`, 'Anonymous User'), // Adapter to persist annotations
    allowTargetShapesStyling: true, // Allow user to change color, line ... Color rendering is not fully supported by Mirador viewer in some case
    commentTemplates: [{ // Templates for comment creation
      content: '<h4>Comment</h4><p>Comment content</p>',
      title: 'Template',
    },
    {
      content: '<h4>Comment2</h4><p>Comment content</p>',
      title: 'Template 2',
    }],
    exportLocalStorageAnnotations: false, 
    quillConfig, // Configuration for the quill editor
    readonly: false, // If true, no annotation creation, edit, deleting is allowed
    tagsSuggestions: ['Mirador', 'Awesome', 'Viewer', 'IIIF', 'Template'], // Tags suggestions for autocompletion
};
```

## Technical aspects from the original plugin

- Mirador 4 support (through your custom Mirador Video)
- Update to Material UI 7 and React 19 to follow latest Mirador upgrades
- The [paperjs](http://paperjs.org/ ) library has been replaced with [Konvas](https://konvajs.org)
- Use `template` to facilitate the creation of annotations with pre-filled content and tags
- Use of `quill` as rich text editor for annotation content
- Mirador Multi User (MMU) support for real time annotation sharing and collaboration (see https://mirador-multi-user.com/)
- New adapter system to facilitate the implementation of annotation persistence and sharing ([Aiiinotation server](https://github.com/Aikon-platform/aiiinotate) )

## Contribute

Our plugin follow the Mirador guidelines. Development, design, and maintenance is driven by community needs and ongoing
feedback and discussion.
To suggest features, report bugs, and clarify usage, please submit a GitHub issue.

### Contributor

The contributors of this software are :

- [Tétras Libre SARL](https://tetras-libre.fr)
  - David Rouquet
  - Anthony Geourjon
  - Antoine Roy
- Leipzig University
  - Gerd Muller
  - fstoe
- École nationale des ponts et chaussées (enpc.fr)
   - paulhectork

### License

This plugin is released under the **GPL v3** license unlike MAE and the original plugin.

Please acknowledge that any modification you make must be distributed under a compatible license and cannot be closed
source.

If you need to integrate this code base in closed source pieces of software, please contact us, so we can discuss dual
licencing.

#### Property

The base of this software (up to V1) is the property of [SATT Ouest Valorisation](https://www.ouest-valorisation.fr/)
that funded its development under the French public contract AO-MA2023-0004-DV5189.

After that, development has been almost fully supported by Tétras Libre with external contributions.
