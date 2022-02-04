# RiskBloX

## Description

RiskBloX is a Risk Management tool that leverages Mitre ATT&CK's Open Source data to concisely display Attack Techniques, their associated Mitigations, real-world examples of the technique and descriptions.

Through filtering of Domain (Enterprise, Mobile and Industrial Control Systems) and additional filters (Threat Groups, Software/Malware, Mitre ATT&CK Tactics and Platforms) the relevant set of attack techniques that could pose a threat will be displayed on separate pages with suggested mitigations. The user assesses the positive impact of how well they may mitigate against that attack technique and then assess their own implementation of the mitigation. This information derives an overall Score for that attack technique.

Upon assessing each Attack Technique, Mitre ATT&CK Navigator is used to give a graphical overview of your defensive coverage and a PDF report can be generated containing all the assessed Attack Techniques and Mitigations, including any notes made throughout the process.
 
## Useful Info

The website version of this tool can be found at https://riskblox.2t-security.co.uk/html/. The website itself contains a clear tutorial and walk-through of this tool and the further customizable options that exist to the user. 

If you come across any bugs in this tool, please do not hesitate to raise this in GitHub issues and we will aim to fix this for you. If you are interested in this projects development and/or would you like to help develop it feel free to get in contact.


## Local Host Version

To be completed

## Projects Used

 * [Mitre ATT&CK Navigator](https://github.com/mitre-attack/attack-navigator) - utilized to give a graphical overview of your defensive coverage
 * [Mitre ATT&CK STIX Data](https://github.com/mitre-attack/attack-stix-data) - used as a source of Mitre ATT&CK data in the website
 * [Mitre STIX2 Python API](https://github.com/oasis-open/cti-python-stix2) - used to interact with the Mitre's TAXII database in the localhost version of RiskBloX
 * [Pako](https://github.com/nodeca/pako) - used to compress the API call that generates a compatible Mitre ATT&CK Navigator Layer

## License
