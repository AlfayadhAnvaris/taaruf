const fs = require('fs');
let file = fs.readFileSync('./src/components/dashboard/MyCvTab.jsx', 'utf8');

const regex = /fontSize:\s*'0\.65rem',[\s\S]*?\{\/\*\s*Card:\s*Pendidikan\s*&\s*Karir\s*\*\/\}/;
const replacement = `fontSize: '0.65rem', 
                          fontWeight: '900',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                            {tab.badge}
                        </span>
                      )}
                    </button>
                  )))}
               </div>

              {activeViewTab === 'cv' ? (
                <div className="cv-grid-layout" style={{ alignItems: 'start', animation: 'fadeIn 0.35s ease' }}>
                 
                 {/* Card: Pendidikan & Karir */}`;

file = file.replace(regex, replacement);
fs.writeFileSync('./src/components/dashboard/MyCvTab.jsx', file);
console.log('Fixed');
