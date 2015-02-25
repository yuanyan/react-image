var React = require('react');
var Img = require('react-image');

var selfCleaningTimeout = {
    componentDidUpdate: function() {
        clearTimeout(this.timeoutID);
    },

    setTimeout: function() {
        clearTimeout(this.timeoutID);
        this.timeoutID = setTimeout.apply(null, arguments);
    }
};

var ComponentPreview = React.createClass({
    propTypes: {
        code: React.PropTypes.string.isRequired
    },

    mixins: [selfCleaningTimeout],

    render: function() {
        return <div ref="mount" />;
    },

    componentDidMount: function() {
        this.executeCode();
    },

    componentDidUpdate: function(prevProps) {
        // execute code only when the state's not being updated by switching tab
        // this avoids re-displaying the error, which comes after a certain delay
        if (this.props.code !== prevProps.code) {
            this.executeCode();
        }
    },

    compileCode: function() {
        return JSXTransformer.transform(
                '(function() {' +
                this.props.code +
                '\n})();',
            { harmony: true }
        ).code;
    },

    executeCode: function() {
        var mountNode = this.refs.mount.getDOMNode();

        try {
            React.unmountComponentAtNode(mountNode);
        } catch (e) { }

        try {
            var compiledCode = this.compileCode();
            React.render(eval(compiledCode), mountNode);
        } catch (err) {
            this.setTimeout(function() {
                React.render(
                    <div className="playgroundError">{err.toString()}</div>,
                    mountNode
                );
            }, 500);
        }
    }
});

var IS_MOBILE = (
    navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
    );

var CodeMirrorEditor = React.createClass({
    componentDidMount: function() {
        if (IS_MOBILE) return;

        this.editor = CodeMirror.fromTextArea(this.refs.editor.getDOMNode(), {
            mode: 'javascript',
            lineNumbers: true,
            lineWrapping: true,
            smartIndent: false,  // javascript mode does bad things with jsx indents
            matchBrackets: true,
            readOnly: this.props.readOnly
        });
        this.editor.on('change', this.handleChange);

        this.editor.on('beforeSelectionChange', function(instance, obj){
            // why is ranges plural?
            var selection = obj.ranges ?
                obj.ranges[0] :
                obj;

            var noRange = selection.anchor.ch === selection.head.ch &&
                selection.anchor.line === selection.head.line;
            if (!noRange) {
                return;
            }

            var cursor = selection.anchor;
            var line = instance.getLine(cursor.line);
            var match = OPEN_MARK.exec(line) || CLOSE_MARK.exec(line);

            // the opening or closing mark appears on this line
            if (match &&
                // and the cursor is on it
                // (this is buggy if both occur on the same line)
                cursor.ch >= match.index &&
                cursor.ch < match.index + 3) {

                // TODO(joel) - figure out why this doesn't fold although it
                // seems like it should work.
                instance.foldCode(cursor, { widget: '...' });
            }
        });
    },

    componentDidUpdate: function() {
        if (this.props.readOnly) {
            this.editor.setValue(this.props.codeText);
        }
    },

    handleChange: function() {
        if (!this.props.readOnly && this.props.onChange) {
            this.props.onChange(this.editor.getValue());
        }
    },

    render: function() {
        // wrap in a div to fully contain CodeMirror
        var editor;

        if (IS_MOBILE) {
            editor = <pre style={{overflow: 'scroll'}}>{this.props.codeText}</pre>;
        } else {
            editor = <textarea ref="editor" defaultValue={this.props.codeText} />;
        }

        return (
            <div style={this.props.style} className={this.props.className}>
            {editor}
            </div>
            );
    }
});

var ReactPlayground = React.createClass({
    propTypes: {
        codeText: React.PropTypes.string.isRequired
    },

    getInitialState: function() {
        return {
            code: this.props.codeText
        };
    },

    handleCodeChange: function(code) {
        this.setState({
            code: code
        });
    },

    render: function() {
        return <div className="playground">
            <div className="playgroundCode">
                <CodeMirrorEditor key="jsx"
                onChange={this.handleCodeChange}
                className="playgroundStage"
                codeText={this.state.code} />
            </div>
            <div className="playgroundPreview">
                <ComponentPreview code={this.state.code} />
            </div>
        </div>;
    }
});

React.render(
    <ReactPlayground codeText={document.getElementById('code1').innerHTML} />,
    document.getElementById('example1')
);

React.render(
    <ReactPlayground codeText={document.getElementById('code2').innerHTML} />,
    document.getElementById('example2')
);

React.render(
    <ReactPlayground codeText={document.getElementById('code3').innerHTML} />,
    document.getElementById('example3')
);
