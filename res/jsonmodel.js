function interface(className, content) {
	return "\n@interface "+className+" :NSObject\n"+content+"\n@end\n";
}

function implement(className) {
	return "\n@implement "+className+"\n@end\n";
}

function assignProperty(propertyType, propertyName) {
	return "    @property (nonatomic , assign) "+propertyType+"              "+propertyName+";\n"
}

function strongProperty(propertyType, propertyName) {
	return "    @property (nonatomic , strong) "+propertyType+"              * "+propertyName+";\n"
}

function copyProperty(propertyType, propertyName) {
	return "    @property (nonatomic , copy) "+propertyType+"              * "+propertyName+";\n"
}

function javaClassHeader(className) {
	return "\npublic static class "+className+"    {\r\n";
}

function javaString(propertyName) {
	return "    public String    "+propertyName+";\r\n";
}

function javaInt(propertyName) {
    return "    public int    "+propertyName+";\r\n";
}

function javaBoolean(propertyName) {
	return "    public boolean    "+propertyName+";\r\n";
}

function javaDouble(propertyName) {
    return "    public double    "+propertyName+";\r\n";
}

function javaList(propertyName, subPropertyName) {
	return "    public List<"+subPropertyName+"> "+propertyName+";\r\n";
}

function javaClassTail() {
	return "}\r\n";
}

function uppercaseFirstLetter(string) {
	var newStr = string.replace(/\b[a-z]/g, function(letter) {
    				return letter.toUpperCase();
	});
	return newStr;
}

function lowercaseFirstLetter(string) {
	var newStr = string.replace(/\b[a-z]/g, function(letter) {
    				return letter.toLowerCase();
	});
	return newStr;
}

function isArray(object) {
    if (object instanceof Object) {
        return object.constructor.prototype.hasOwnProperty('push');
    }
    return false;
}

function isMap(object) {
    if (object instanceof Object) {
        return !object.constructor.prototype.hasOwnProperty('push');
    }
    return false;
}

var classHeaderString='';
var classImplementString ='';
var javaBinString='';
var javaSubBin='';

function generateFile(json, fileName) {
	classHeaderString ='';
	classImplementString='';
	javaBinString='';
	javaSubBin='';

	if (fileName.length == 0) {
		fileName = 'ModelName';
	}

	var propertyContent = generateContent(json, fileName);

	classHeaderString = classHeaderString+interface(fileName, propertyContent);
	classImplementString = classImplementString+implement(fileName);
	javaBinString = javaClassHeader(fileName)+propertyContent;

	var headerCode = document.createElement("pre");
	headerCode.setAttribute("id", "headCode");
	headerCode.setAttribute("class", "model-result");
    headerCode.append(classHeaderString);

	document.getElementById('precode').appendChild(headerCode)


    var implementCode = document.createElement("pre");
    implementCode.setAttribute("id", "implementCode");
    implementCode.setAttribute("class", "model-result");
    implementCode.append(classImplementString);

    document.getElementById('precode').appendChild(implementCode)

	//document.getElementById('model').value=classHeaderString+classImplementString;
}

function generateContent(object, key) {
	var propertyString = '';

	if (Array.isArray(object)) {
		if (object.length > 0) {
			var array = object;
			if (array.length > 0) {
				var tmpobject = array[0];
				for (var i = array.length - 1; i >= 0; i--) {
					var subObject = array[i];
					if (isArray(subObject)) {
						if (subObject.length > tmpobject.length) {
							tmpobject = subObject;
						}
					}else if (isMap(subObject)) {
                        if (subObject.length > tmpobject.length) {
                            tmpobject = subObject;
                        }
                    }
				}
                propertyString = propertyString+generateContent(tmpobject, key);
			}
		}
	}else if (isMap(object)) {
		for (var subKey in object) {
			subObject = object[subKey];
			var subClassName = uppercaseFirstLetter(subKey);
			var subPropertyName = lowercaseFirstLetter(subKey);

			if (isArray(subObject)) {

				var firstObject;
				var subPropertyString;

				if (subObject.length > 0) {
					firstObject = subObject[0];
				}

				if (typeof(firstObject) === 'string') {
					propertyString = propertyString + strongProperty("NSArray <NSString *>", subPropertyName);
				}else if (typeof(firstObject) === 'number' || typeof(firstObject) === 'boolean') {
					propertyString = propertyString + strongProperty("NSArray <NSNumber *>", subPropertyName);
				}else if (typeof(firstObject) === 'object') {
				    var subModelItemName = subClassName+"Item";
                    propertyString = propertyString + strongProperty("NSArray <"+subModelItemName+" *>", subPropertyName);
					subPropertyString = generateContent(subObject, subKey);
					classHeaderString = classHeaderString + interface(subModelItemName, subPropertyString);
					classImplementString = classImplementString + implement(subModelItemName);
				}


			}else if (isMap(subObject)) {
				var subPropertyString = generateContent(subObject, subKey);

				propertyString = propertyString + strongProperty(subClassName, subPropertyName);
				classHeaderString = classHeaderString + interface(subClassName, subPropertyString);
				classImplementString = classImplementString + implement(subClassName);
			}else if (typeof(subObject) === 'string') {
                propertyString = propertyString + copyProperty("NSString", subPropertyName);
            }else if (typeof(subObject) === 'number') {
			    var str = subObject.toString();
			    if (str.indexOf('.') >= 0) {
                    propertyString = propertyString + assignProperty("CGFloat", subPropertyName);
                }else {
                    propertyString = propertyString + assignProperty("NSInteger", subPropertyName);
                }

            }else if (typeof(subObject) === 'boolean') {
                propertyString = propertyString + assignProperty("BOOL", subPropertyName);
            }

		}
	}else {
		alert("key = "+key)
	}

	return propertyString;
}

function generateJavaFile(json, fileName) {
    classHeaderString='';
    classImplementString='';
    javaBinString='';
    javaSubBin='';

    if (fileName.length == 0) {
        fileName = 'ModelName';
    }

    var propertyContent = generateJavaContent(json, fileName);

    javaBinString = javaClassHeader(fileName)+propertyContent+javaClassTail();

    var implementCode = document.createElement("pre");
    implementCode.setAttribute("id", "implementCode");
    implementCode.setAttribute("class", "model-result");
    implementCode.append(javaSubBin+"\r\n"+javaBinString);

    document.getElementById('precode').appendChild(implementCode)

    //document.getElementById('model').value=classHeaderString+classImplementString;
}

function generateJavaContent(object, key) {
    var javaPropertyString = '';

    if (Array.isArray(object)) {
        if (object.length > 0) {
            var array = object;
            if (array.length > 0) {
                var tmpobject = array[0];
                for (var i = array.length - 1; i >= 0; i--) {
                    var subObject = array[i];
                    if (isArray(subObject)) {
                        if (subObject.length > tmpobject.length) {
                            tmpobject = subObject;
                        }
                    }else if (isMap(subObject)) {
                        if (subObject.length > tmpobject.length) {
                            tmpobject = subObject;
                        }
                    }
                }
                javaPropertyString = javaPropertyString+generateJavaContent(tmpobject, key);
            }
        }
    }else if (isMap(object)) {
        for (var subKey in object) {
            subObject = object[subKey];
            var subClassName = uppercaseFirstLetter(subKey);
            var subPropertyName = lowercaseFirstLetter(subKey);

            if (isArray(subObject)) {

                var firstObject;
                var subJavaPropertyString;

                if (subObject.length > 0) {
                    firstObject = subObject[0];
                }

                if (typeof(firstObject) === 'string') {
                    javaPropertyString = javaPropertyString + javaString(subPropertyName);
                }else if (typeof(firstObject) === 'number' || typeof(firstObject) === 'boolean') {
                    javaPropertyString = javaPropertyString + javaInt(subPropertyName);
                }else if (typeof(firstObject) === 'object') {
                	var subBinName = subClassName+"Item";
                    javaPropertyString = javaPropertyString + javaList(subPropertyName, subBinName);

					var subJavaString = javaClassHeader(subBinName) + generateJavaContent(subObject, subKey) + javaClassTail();

					javaSubBin = javaSubBin + subJavaString;
                }

            }else if (isMap(subObject)) {

                var subJavaString = javaClassHeader(subPropertyName) + generateJavaContent(subObject, subKey) + javaClassTail();

                javaSubBin = javaSubBin + subJavaString;

            }else if (typeof(subObject) === 'string') {
                javaPropertyString = javaPropertyString + javaString(subPropertyName);
            }else if (typeof(subObject) === 'number') {
                var str = subObject.toString();
                if (str.indexOf('.') >= 0) {
                    javaPropertyString = javaPropertyString + javaDouble(subPropertyName);
                }else {
                    javaPropertyString = javaPropertyString + javaInt(subPropertyName);
                }
            }else if (typeof(subObject) === 'boolean') {
                javaPropertyString = javaPropertyString + javaBoolean(subPropertyName);
            }

        }
    }else {
        alert("key = "+key)
    }

    return javaPropertyString;
}

function convertModel() {
	var fileName = document.getElementById("fileName").value.trim();
	var code = document.getElementById("code");
    var jsonStr = code.value.trim();
    console.log(jsonStr);
    var obj =  eval('(' + jsonStr + ')');
    console.log(obj);
    generateFile(obj, uppercaseFirstLetter(fileName));
}

function convertJavaBin() {
    var fileName = document.getElementById("fileName").value.trim();
    var code = document.getElementById("code");
    var jsonStr = code.value.trim();
    console.log(jsonStr);
    var obj =  eval('(' + jsonStr + ')');
    console.log(obj);
    generateJavaFile(obj, uppercaseFirstLetter(fileName));
}

function clearContent() {
    document.getElementById("result-container").removeAttribute("class");
    document.getElementById("precode").innerHTML = "";
}